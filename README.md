# Ollama Realtime Chat - Cloudflare Edition

A production-ready realtime AI chat application built on Cloudflare's edge infrastructure, powered by Ollama Cloud's DeepSeek V3.1 model with WebSocket streaming for instant responses.

## Architecture

- **Cloudflare Workers**: Serves the frontend and handles HTTP requests
- **Durable Objects**: Manages WebSocket connections and conversation state
- **Ollama Cloud**: Streams AI responses using the DeepSeek V3.1 671B model
- **Edge Computing**: Low-latency responses from Cloudflare's global network

## Features

- 🚀 Real-time streaming responses from Ollama Cloud
- ⚡ Edge-optimized with Cloudflare Workers + Durable Objects
- 💬 WebSocket-based communication for ultra-low latency
- 🎨 Beautiful, modern UI with gradient design
- 📱 Responsive design that works on all devices
- 🔄 Automatic reconnection on connection loss
- 💾 Session-based conversation history (in-memory)
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- 🧹 Clear conversation history functionality
- 🌍 Deployed globally on Cloudflare's edge network

## Prerequisites

- Node.js (v16 or higher)
- Cloudflare account (free tier works!)
- Ollama Cloud API key
- Access to deepseek-v3.1:671b-cloud model

## Installation

1. Clone this repository:
```bash
git clone https://github.com/whobcode/ollamaapp.git
cd ollamaapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Ollama API key:
```bash
npx wrangler secret put OLLAMA_API_KEY
# Enter: your-ollama-api-key
```

## Development

### Local Development:
```bash
npm run dev
```

The application will be available at `http://localhost:8787`

### Deploy to Cloudflare:
```bash
# Login to Cloudflare (first time only)
npx wrangler login

# Deploy
npm run deploy
```

### View Logs:
```bash
npm run tail
```

## Project Structure

```
ollamaapp/
├── src/
│   ├── worker.js           # Main Cloudflare Worker
│   └── chat-session.js     # Durable Object for WebSocket sessions
├── public/                 # (Inlined in worker.js)
│   ├── index.html         # Web interface
│   └── app.js             # Client-side WebSocket handling
├── wrangler.toml          # Cloudflare configuration
├── package.json
├── .gitignore
└── README.md
```

## How It Works

### Architecture Flow

1. **Client Connection**: User opens the app, browser generates a random session ID (stored in localStorage)
2. **WebSocket Upgrade**: Browser connects to `/ws?session={sessionId}` endpoint
3. **Durable Object Routing**: Worker routes the WebSocket to a Durable Object instance based on session ID
4. **Session Management**: Each session gets its own Durable Object with in-memory conversation history
5. **Streaming**: When user sends a message, Durable Object streams responses from Ollama Cloud in real-time
6. **Edge Distribution**: Everything runs on Cloudflare's edge network for minimal latency

### Session Management

- **Random Session ID**: Generated per browser using `crypto.randomUUID()`
- **localStorage**: Session ID persisted in browser localStorage
- **In-Memory History**: Conversation history kept in Durable Object memory (not persisted to storage)
- **Fresh Start**: Page refresh creates a new conversation (history is lost)

### Ollama Cloud Integration

Uses the official Ollama JavaScript SDK with browser-compatible build:
```javascript
import { Ollama } from 'ollama/browser';

const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: {
    'Authorization': `Bearer ${OLLAMA_API_KEY}`
  }
});
```

## API Endpoints

- `GET /` - Serves the web interface
- `GET /health` - Health check endpoint
- `WebSocket /ws?session={sessionId}` - WebSocket connection for real-time chat

## WebSocket Message Protocol

### Client to Server:
```json
{
  "type": "chat",
  "content": "Your message here"
}

{
  "type": "clear"
}
```

### Server to Client:
```json
{
  "type": "welcome",
  "message": "Connected to Ollama Chat with deepseek-v3.1:671b-cloud",
  "model": "deepseek-v3.1:671b-cloud"
}

{
  "type": "ack",
  "message": "Message received, generating response..."
}

{
  "type": "stream",
  "content": "token chunk",
  "done": false
}

{
  "type": "complete",
  "message": "Response complete"
}

{
  "type": "error",
  "message": "Error description"
}
```

## Configuration

### Environment Variables (wrangler.toml)

```toml
[vars]
MODEL = "deepseek-v3.1:671b-cloud"
OLLAMA_HOST = "https://ollama.com"

# Set via CLI:
# wrangler secret put OLLAMA_API_KEY
```

### Durable Objects

The application uses Cloudflare Durable Objects for:
- WebSocket connection management
- Session-based conversation history
- State isolation per session

## Performance

- **Latency**: Sub-second response times via edge compute
- **Scalability**: Automatic scaling with Cloudflare Workers
- **Global**: Deployed to 300+ Cloudflare edge locations
- **Concurrent Users**: Handles thousands of simultaneous connections

## Deployment

### First Time Setup:

1. Install Wrangler globally (optional):
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Set your API key:
```bash
wrangler secret put OLLAMA_API_KEY
```

4. Deploy:
```bash
npm run deploy
```

### Your app will be live at:
```
https://ollamaapp.<your-subdomain>.workers.dev
```

### Custom Domain (Optional):

Add a custom domain in your Cloudflare dashboard:
1. Go to Workers & Pages
2. Click on your worker
3. Go to Settings > Triggers > Custom Domains
4. Add your domain

## Costs

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Durable Objects**: Free tier includes 1M requests/month
- **Ollama Cloud**: Pay per token usage
- **Total**: Can run on free tier for development/testing

## Troubleshooting

### WebSocket Connection Issues:
- Check browser console for errors
- Ensure you're using HTTPS in production
- Verify API key is set: `wrangler secret list`

### Streaming Not Working:
- Check Wrangler logs: `npm run tail`
- Verify Ollama API key is valid
- Check model availability

### Deployment Failures:
- Ensure you're logged in: `wrangler whoami`
- Check wrangler.toml syntax
- Review migration settings for Durable Objects

## Development Tips

1. **Local Testing**: Use `npm run dev` for local development with hot reload
2. **Logs**: Use `npm run tail` to view real-time logs from production
3. **Debugging**: Add `console.log()` statements - they appear in wrangler logs
4. **Session Testing**: Clear localStorage to reset session ID

## License

MIT

## Author

Created with Claude Code, Ollama, and Cloudflare Workers

## Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Ollama Cloud](https://ollama.com)
- [GitHub Repository](https://github.com/whobcode/ollamaapp)
