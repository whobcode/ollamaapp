import { Ollama } from 'ollama/browser';

export class ChatSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // Map of WebSocket connections
    this.conversationHistory = []; // In-memory conversation history
  }

  async fetch(request) {
    // Expect WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Store this session
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    // Handle WebSocket events
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

    // Send welcome message
    server.send(JSON.stringify({
      type: 'welcome',
      message: `Connected to Ollama Chat with ${this.env.MODEL || 'deepseek-v3.1:671b-cloud'}`,
      model: this.env.MODEL || 'deepseek-v3.1:671b-cloud'
    }));

    // Return the client WebSocket to complete the upgrade
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'chat':
        await this.handleChat(ws, data.content);
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

  async handleChat(ws, userMessage) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'ack',
      message: 'Message received, generating response...'
    }));

    try {
      // Initialize Ollama client
      const ollama = new Ollama({
        host: this.env.OLLAMA_HOST || 'https://ollama.com',
        headers: {
          'Authorization': `Bearer ${this.env.OLLAMA_API_KEY}`
        }
      });

      // Stream response from Ollama
      const response = await ollama.chat({
        model: this.env.MODEL || 'deepseek-v3.1:671b-cloud',
        messages: this.conversationHistory,
        stream: true,
      });

      let fullResponse = '';

      // Stream chunks to client
      for await (const part of response) {
        if (part.message?.content) {
          fullResponse += part.message.content;

          // Send chunk to client
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

      // Send completion signal
      ws.send(JSON.stringify({
        type: 'complete',
        message: 'Response complete'
      }));

    } catch (error) {
      console.error('Ollama streaming error:', error);

      // Send error to client
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error streaming from Ollama: ${error.message}`
      }));

      // Remove the user message from history since we couldn't get a response
      this.conversationHistory.pop();
    }
  }
}
