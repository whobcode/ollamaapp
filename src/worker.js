import { ChatSession } from './chat-session.js';

// Export Durable Object class
export { ChatSession };

// Available models
const MODELS = [
  { id: 'deepseek-v3.1:671b-cloud', name: 'DeepSeek V3.1 (671B)', type: 'text' },
  { id: 'gpt-oss:120b-cloud', name: 'GPT-OSS (120B)', type: 'text' },
  { id: 'qwen3-vl:235b-instruct-cloud', name: 'Qwen3 VL Instruct (235B)', type: 'vision' },
  { id: 'qwen3-vl:235b-cloud', name: 'Qwen3 VL (235B)', type: 'vision' },
  { id: 'qwen3-coder:480b-cloud', name: 'Qwen3 Coder (480B)', type: 'text' },
  { id: 'glm-4.6:cloud', name: 'GLM 4.6', type: 'text' },
  { id: 'minimax-m2:cloud', name: 'MiniMax M2', type: 'text' },
  { id: 'gemini-3-pro-preview:latest', name: 'Gemini 3 Pro Preview', type: 'vision' },
  { id: 'kimi-k2-thinking:cloud', name: 'Kimi K2 Thinking', type: 'text' },
  { id: 'cogito-2.1:671b-cloud', name: 'Cogito 2.1 (671B)', type: 'text' },
  { id: 'kimi-k2:1t-cloud', name: 'Kimi K2 (1T)', type: 'text' }
];

// Main Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API endpoint to get available models
    if (url.pathname === '/api/models') {
      return new Response(JSON.stringify(MODELS), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        models: MODELS.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // WebSocket upgrade request
    if (url.pathname === '/ws') {
      const sessionId = url.searchParams.get('session') || crypto.randomUUID();
      const id = env.CHAT_SESSION.idFromName(sessionId);
      const durableObject = env.CHAT_SESSION.get(id);
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

    return new Response('Not Found', { status: 404 });
  }
};

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ollama Realtime Chat - Multi-Model</title>
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
      max-width: 1000px;
      height: 95vh;
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
      padding: 15px 30px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .header h1 {
      font-size: 22px;
      font-weight: 600;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    .status-dot.disconnected {
      background: #ef4444;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .model-selector {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .model-selector label {
      font-size: 13px;
      font-weight: 500;
    }

    .model-selector select {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      min-width: 200px;
    }

    .model-selector select option {
      background: #667eea;
      color: white;
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
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
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
      max-width: 100%;
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .attached-files {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .file-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .file-badge-icon {
      font-size: 14px;
    }

    .attached-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      margin-top: 8px;
    }

    .system-message {
      text-align: center;
      padding: 12px;
      background: #e0e7ff;
      border-radius: 12px;
      font-size: 13px;
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
    }

    .attached-files-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
    }

    .attached-file-item {
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .remove-file {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .input-row {
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
      font-size: 15px;
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
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
      white-space: nowrap;
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

    #attachButton {
      background: #10b981;
    }

    #attachButton:hover {
      background: #059669;
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

    #fileInput {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <h1>Ollama Realtime Chat</h1>
        <div class="status">
          <div class="status-dot disconnected" id="statusDot"></div>
          <span id="statusText">Connecting...</span>
        </div>
      </div>
      <div class="model-selector">
        <label for="modelSelect">Model:</label>
        <select id="modelSelect">
          <option value="">Loading models...</option>
        </select>
      </div>
    </div>

    <div class="chat-container" id="chatContainer">
      <div class="system-message">
        Welcome to Ollama Realtime Chat - Multi-Model Edition
      </div>
    </div>

    <div class="input-container">
      <div id="attachedFilesPreview" class="attached-files-preview"></div>

      <div class="input-row">
        <div class="input-wrapper">
          <textarea
            id="messageInput"
            placeholder="Type your message or attach files..."
            rows="1"
          ></textarea>
        </div>
        <div class="controls">
          <button id="attachButton" title="Attach files (images, documents, audio, video)">📎 Attach</button>
          <button id="sendButton" disabled>Send</button>
          <button id="clearButton">Clear</button>
        </div>
      </div>

      <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.json,.csv,.md">
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
let selectedModel = 'deepseek-v3.1:671b-cloud';
let attachedFiles = [];
let availableModels = [];

// DOM elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');
const attachButton = document.getElementById('attachButton');
const fileInput = document.getElementById('fileInput');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const modelSelect = document.getElementById('modelSelect');
const attachedFilesPreview = document.getElementById('attachedFilesPreview');

// Load available models
async function loadModels() {
  try {
    const response = await fetch('/api/models');
    availableModels = await response.json();

    modelSelect.innerHTML = '';
    availableModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name + (model.type === 'vision' ? ' 👁️' : '');
      modelSelect.appendChild(option);
    });

    modelSelect.value = selectedModel;
  } catch (error) {
    console.error('Error loading models:', error);
    modelSelect.innerHTML = '<option>Error loading models</option>';
  }
}

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
function addMessage(role, content, files = []) {
  const messageDiv = document.createElement('div');
  messageDiv.className = \`message \${role}\`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;

  // Add file attachments display
  if (files && files.length > 0) {
    const filesDiv = document.createElement('div');
    filesDiv.className = 'attached-files';

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = file.data;
        img.className = 'attached-image';
        img.alt = file.name;
        messageContent.appendChild(img);
      } else {
        const badge = document.createElement('div');
        badge.className = 'file-badge';
        badge.innerHTML = \`
          <span class="file-badge-icon">\${getFileIcon(file.type)}</span>
          <span>\${file.name}</span>
        \`;
        filesDiv.appendChild(badge);
      }
    });

    if (filesDiv.children.length > 0) {
      messageContent.appendChild(filesDiv);
    }
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatContainer.appendChild(messageDiv);
  scrollToBottom();

  return messageContent;
}

// Get file icon based on type
function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('text')) return '📝';
  return '📎';
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

// Handle file selection
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);

  for (const file of files) {
    const reader = new FileReader();

    reader.onload = (event) => {
      attachedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result
      });

      updateAttachedFilesPreview();
    };

    // Read as data URL for all files
    reader.readAsDataURL(file);
  }

  // Reset file input
  fileInput.value = '';
});

// Update attached files preview
function updateAttachedFilesPreview() {
  attachedFilesPreview.innerHTML = '';

  attachedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'attached-file-item';

    fileItem.innerHTML = \`
      <span>\${getFileIcon(file.type)}</span>
      <span>\${file.name}</span>
      <button class="remove-file" data-index="\${index}">✕</button>
    \`;

    attachedFilesPreview.appendChild(fileItem);
  });

  // Add remove handlers
  document.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      attachedFiles.splice(index, 1);
      updateAttachedFilesPreview();
    });
  });
}

// Send message
function sendMessage() {
  const message = messageInput.value.trim();

  if ((!message && attachedFiles.length === 0) || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  // Add user message to chat with files
  addMessage('user', message || '(files attached)', [...attachedFiles]);

  // Send to server
  ws.send(JSON.stringify({
    type: 'chat',
    content: message,
    model: selectedModel,
    files: attachedFiles.map(f => ({
      name: f.name,
      type: f.type,
      data: f.data
    }))
  }));

  // Clear input and files
  messageInput.value = '';
  messageInput.style.height = 'auto';
  attachedFiles = [];
  updateAttachedFilesPreview();
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
attachButton.addEventListener('click', () => fileInput.click());

modelSelect.addEventListener('change', (e) => {
  selectedModel = e.target.value;
  addSystemMessage(\`Switched to model: \${e.target.options[e.target.selectedIndex].text}\`);
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Initialize
loadModels();
connect();
`;
