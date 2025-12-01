import express from 'express';
import { WebSocketServer } from 'ws';
import { Ollama } from 'ollama';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const MODEL = 'deepseek-v3.1:671b-cloud';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Initialize Ollama client
const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: {
    'Authorization': `Bearer ${OLLAMA_API_KEY}`
  }
});

// Serve static files
app.use(express.static(join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Store conversation history for this connection
  const conversationHistory = [];

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'chat') {
        const userMessage = message.content;

        // Add user message to history
        conversationHistory.push({
          role: 'user',
          content: userMessage
        });

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'ack',
          message: 'Message received, generating response...'
        }));

        // Stream the response from Ollama
        try {
          const response = await ollama.chat({
            model: MODEL,
            messages: conversationHistory,
            stream: true,
          });

          let fullResponse = '';

          // Send streaming chunks to client
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
          conversationHistory.push({
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
          ws.send(JSON.stringify({
            type: 'error',
            message: `Error streaming from Ollama: ${error.message}`
          }));
        }
      } else if (message.type === 'clear') {
        // Clear conversation history
        conversationHistory.length = 0;
        ws.send(JSON.stringify({
          type: 'cleared',
          message: 'Conversation history cleared'
        }));
      }
    } catch (error) {
      console.error('Message processing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error processing message: ${error.message}`
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: `Connected to Ollama Realtime Chat with ${MODEL}`,
    model: MODEL
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Using model: ${MODEL}`);
  console.log(`Ollama API Key: ${OLLAMA_API_KEY ? '***' + OLLAMA_API_KEY.slice(-4) : 'NOT SET'}`);
});
