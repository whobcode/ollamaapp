import { Ollama } from 'ollama/browser';

export class ChatSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // sessionId -> { ws, peerId }
    this.conversationHistory = [];
    this.currentModel = 'deepseek-v3.1:671b-cloud';
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const sessionId = crypto.randomUUID();

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleMessage(server, sessionId, data);
      } catch (error) {
        console.error('Error handling message:', error);
        server.send(JSON.stringify({
          type: 'error',
          message: `Error: ${error.message}`
        }));
      }
    });

    server.addEventListener('close', () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        // Notify other peers that this peer left
        this.broadcast({
          type: 'peer-left',
          peerId: session.peerId
        }, sessionId);

        this.sessions.delete(sessionId);
        console.log('Client disconnected:', session.peerId);
      }
    });

    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(sessionId);
    });

    server.send(JSON.stringify({
      type: 'welcome',
      message: `Connected to Ollama Chat - Multi-Model Edition with Video`,
      model: this.currentModel
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMessage(ws, sessionId, data) {
    switch (data.type) {
      case 'presence':
        // Register peer
        this.sessions.set(sessionId, {
          ws: ws,
          peerId: data.peerId
        });

        // Notify this peer about all existing peers
        this.sessions.forEach((session, sid) => {
          if (sid !== sessionId) {
            ws.send(JSON.stringify({
              type: 'peer-joined',
              peerId: session.peerId
            }));
          }
        });

        // Notify all other peers about this new peer
        this.broadcast({
          type: 'peer-joined',
          peerId: data.peerId
        }, sessionId);
        break;

      case 'chat':
        // Update model if specified
        if (data.model) {
          this.currentModel = data.model;
        }
        await this.handleChat(ws, data.content, data.files || []);
        break;

      case 'clear':
        this.conversationHistory = [];
        ws.send(JSON.stringify({
          type: 'cleared',
          message: 'Conversation history cleared'
        }));
        break;

      // WebRTC signaling
      case 'video-started':
      case 'video-stopped':
        // Broadcast to all other peers
        this.broadcast(data, sessionId);
        break;

      case 'webrtc-offer':
      case 'webrtc-answer':
      case 'webrtc-ice':
        // Relay to specific peer
        this.relayToPeer(data, data.peerId);
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  // Broadcast message to all peers except sender
  broadcast(message, excludeSessionId) {
    this.sessions.forEach((session, sid) => {
      if (sid !== excludeSessionId) {
        try {
          session.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting to peer:', error);
        }
      }
    });
  }

  // Relay message to specific peer
  relayToPeer(message, targetPeerId) {
    this.sessions.forEach((session) => {
      if (session.peerId === targetPeerId) {
        try {
          session.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error relaying to peer:', error);
        }
      }
    });
  }

  async handleChat(ws, userMessage, files) {
    // Build text content and collect images
    const textParts = [];
    const images = [];

    // Add text if present
    if (userMessage) {
      textParts.push(userMessage);
    }

    // Process attached files
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // For vision models, extract base64 data
        // Ollama expects just the base64 data without the data URL prefix
        const base64Data = file.data.split(',')[1];
        images.push(base64Data);
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        // For audio/video, add as text description
        textParts.push(`[${file.type.startsWith('video/') ? 'Video' : 'Audio'} file attached: ${file.name}]`);
      } else {
        // For documents, try to extract text content
        try {
          // If it's a data URL with text content
          if (file.data.startsWith('data:text/') || file.data.includes('text/plain')) {
            const base64Data = file.data.split(',')[1];
            const textContent = atob(base64Data);
            textParts.push(`Content of ${file.name}:\n${textContent}`);
          } else {
            textParts.push(`[Document attached: ${file.name}]`);
          }
        } catch (error) {
          textParts.push(`[Document attached: ${file.name}]`);
        }
      }
    }

    // Create the message object - Ollama expects simple string content
    const message = {
      role: 'user',
      content: textParts.join('\n\n')
    };

    // Add images if present (for vision models)
    if (images.length > 0) {
      message.images = images;
    }

    // Add to conversation history
    this.conversationHistory.push(message);

    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'ack',
      message: 'Message received, generating response...'
    }));

    try {
      const ollama = new Ollama({
        host: this.env.OLLAMA_HOST || 'https://ollama.com',
        headers: {
          'Authorization': `Bearer ${this.env.OLLAMA_API_KEY}`
        }
      });

      // Stream response from Ollama
      const response = await ollama.chat({
        model: this.currentModel,
        messages: this.conversationHistory,
        stream: true,
      });

      let fullResponse = '';

      for await (const part of response) {
        if (part.message?.content) {
          fullResponse += part.message.content;

          ws.send(JSON.stringify({
            type: 'stream',
            content: part.message.content,
            done: part.done || false
          }));
        }
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      ws.send(JSON.stringify({
        type: 'complete',
        message: 'Response complete'
      }));

    } catch (error) {
      console.error('Ollama streaming error:', error);

      ws.send(JSON.stringify({
        type: 'error',
        message: `Error streaming from Ollama: ${error.message}`
      }));

      // Remove the user message from history since we couldn't get a response
      this.conversationHistory.pop();
    }
  }
}
