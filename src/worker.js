import { ChatSession } from './chat-session.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Export Durable Object class
export { ChatSession };

// Main Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        model: env.MODEL || 'deepseek-v3.1:671b-cloud',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // WebSocket upgrade request
    if (url.pathname === '/ws') {
      // Get session ID from query parameter or generate new one
      const sessionId = url.searchParams.get('session') || crypto.randomUUID();

      // Get Durable Object for this session
      const id = env.CHAT_SESSION.idFromName(sessionId);
      const durableObject = env.CHAT_SESSION.get(id);

      // Forward the request to the Durable Object
      return durableObject.fetch(request);
    }

    // Serve static files
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    if (url.pathname === '/app.js') {
      return new Response(APP_JS, {
        headers: { 'Content-Type': 'application/javascript;charset=UTF-8' }
      });
    }

    // 404 for everything else
    return new Response('Not Found', { status: 404 });
  }
};

// Inline HTML (will be replaced with actual content)
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ollama Realtime Chat - DeepSeek V3.1</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 900px;
      height: 90vh;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 600;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    .status-dot.disconnected {
      background: #ef4444;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: #f9fafb;
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 80%;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .message.user .message-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .message.assistant .message-avatar {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .message-content {
      background: white;
      padding: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .system-message {
      text-align: center;
      padding: 12px;
      background: #e0e7ff;
      border-radius: 12px;
      font-size: 14px;
      color: #4338ca;
      align-self: center;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 16px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }

    .input-container {
      padding: 20px 30px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    #messageInput {
      width: 100%;
      padding: 14px 20px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.3s;
      resize: none;
      min-height: 50px;
      max-height: 120px;
    }

    #messageInput:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
    }

    #sendButton {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    #sendButton:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    #sendButton:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #clearButton {
      background: #ef4444;
    }

    #clearButton:hover {
      background: #dc2626;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ollama Realtime Chat</h1>
      <div class="status">
        <div class="status-dot disconnected" id="statusDot"></div>
        <span id="statusText">Connecting...</span>
      </div>
    </div>

    <div class="chat-container" id="chatContainer">
      <div class="system-message">
        Welcome to Ollama Realtime Chat powered by DeepSeek V3.1
      </div>
    </div>

    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          id="messageInput"
          placeholder="Type your message..."
          rows="1"
        ></textarea>
      </div>
      <div class="controls">
        <button id="sendButton" disabled>Send</button>
        <button id="clearButton">Clear</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`;

const APP_JS = `// WebSocket connection
let ws = null;
let isStreaming = false;
let currentAssistantMessage = null;
let sessionId = null;

// DOM elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Get or create session ID
function getSessionId() {
  if (!sessionId) {
    sessionId = localStorage.getItem('ollama_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('ollama_session_id', sessionId);
    }
  }
  return sessionId;
}

// Connect to WebSocket server
function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = \`\${protocol}//\${window.location.host}/ws?session=\${getSessionId()}\`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Connected to server');
    updateStatus('connected', 'Connected');
    sendButton.disabled = false;
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateStatus('disconnected', 'Error');
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
    updateStatus('disconnected', 'Disconnected');
    sendButton.disabled = true;

    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      connect();
    }, 3000);
  };
}

// Update connection status
function updateStatus(status, text) {
  statusDot.className = 'status-dot';
  if (status !== 'connected') {
    statusDot.classList.add('disconnected');
  }
  statusText.textContent = text;
}

// Handle incoming messages
function handleMessage(data) {
  switch (data.type) {
    case 'welcome':
      addSystemMessage(data.message);
      break;

    case 'ack':
      isStreaming = true;
      sendButton.disabled = true;
      showTypingIndicator();
      break;

    case 'stream':
      hideTypingIndicator();

      if (!currentAssistantMessage) {
        currentAssistantMessage = addMessage('assistant', '');
      }

      // Append streamed content
      currentAssistantMessage.textContent += data.content;
      scrollToBottom();
      break;

    case 'complete':
      isStreaming = false;
      sendButton.disabled = false;
      currentAssistantMessage = null;
      messageInput.focus();
      break;

    case 'error':
      hideTypingIndicator();
      addSystemMessage(\`Error: \${data.message}\`);
      isStreaming = false;
      sendButton.disabled = false;
      currentAssistantMessage = null;
      break;

    case 'cleared':
      addSystemMessage('Conversation cleared');
      break;
  }
}

// Add message to chat
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = \`message \${role}\`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatContainer.appendChild(messageDiv);
  scrollToBottom();

  return messageContent;
}

// Add system message
function addSystemMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.textContent = content;
  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
  hideTypingIndicator();

  const indicator = document.createElement('div');
  indicator.className = 'message assistant';
  indicator.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'AI';

  const typingDiv = document.createElement('div');
  typingDiv.className = 'message-content';

  const typingDots = document.createElement('div');
  typingDots.className = 'typing-indicator';
  typingDots.innerHTML = '<span></span><span></span><span></span>';

  typingDiv.appendChild(typingDots);
  indicator.appendChild(avatar);
  indicator.appendChild(typingDiv);

  chatContainer.appendChild(indicator);
  scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

// Scroll to bottom of chat
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message
function sendMessage() {
  const message = messageInput.value.trim();

  if (!message || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  addMessage('user', message);

  ws.send(JSON.stringify({
    type: 'chat',
    content: message
  }));

  messageInput.value = '';
  messageInput.style.height = 'auto';
}

// Clear conversation
function clearConversation() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  chatContainer.innerHTML = '';
  addSystemMessage('Conversation cleared - Starting fresh!');

  ws.send(JSON.stringify({
    type: 'clear'
  }));
}

// Auto-resize textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// Event listeners
sendButton.addEventListener('click', sendMessage);
clearButton.addEventListener('click', clearConversation);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Initialize connection
connect();
`;
