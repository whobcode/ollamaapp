import { Ollama } from 'ollama/browser';

export class ChatSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
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
    this.sessions.set(sessionId, server);

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleMessage(server, data);
      } catch (error) {
        console.error('Error handling message:', error);
        server.send(JSON.stringify({
          type: 'error',
          message: `Error: ${error.message}`
        }));
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      console.log('Client disconnected');
    });

    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(sessionId);
    });

    server.send(JSON.stringify({
      type: 'welcome',
      message: `Connected to Ollama Chat - Multi-Model Edition`,
      model: this.currentModel
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMessage(ws, data) {
    switch (data.type) {
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

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  async handleChat(ws, userMessage, files) {
    // Build message content
    const messageContent = [];

    // Add text if present
    if (userMessage) {
      messageContent.push({
        type: 'text',
        text: userMessage
      });
    }

    // Process attached files
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // For vision models, add image in base64 format
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: file.data
          }
        });
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        // For audio/video, add as text description for now
        // In the future, these could be transcribed or processed
        messageContent.push({
          type: 'text',
          text: `[${file.type.startsWith('video/') ? 'Video' : 'Audio'} file attached: ${file.name}]`
        });
      } else {
        // For documents, try to extract text content
        // Note: In a real implementation, you'd extract text from PDFs, docs, etc.
        // For now, we'll treat them as attachments
        try {
          // If it's a data URL with text content
          if (file.data.startsWith('data:text/') || file.data.includes('text/plain')) {
            const base64Data = file.data.split(',')[1];
            const textContent = atob(base64Data);
            messageContent.push({
              type: 'text',
              text: `Content of ${file.name}:\\n${textContent}`
            });
          } else {
            messageContent.push({
              type: 'text',
              text: `[Document attached: ${file.name}]`
            });
          }
        } catch (error) {
          messageContent.push({
            type: 'text',
            text: `[Document attached: ${file.name}]`
          });
        }
      }
    }

    // Create the message object
    const message = messageContent.length === 1 && messageContent[0].type === 'text'
      ? { role: 'user', content: messageContent[0].text }
      : { role: 'user', content: messageContent };

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
