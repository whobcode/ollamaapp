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
  <title>Ollama Realtime Chat - Multi-Model with Video</title>
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
      max-width: 1200px;
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 600;
    }

    .video-toggle-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }

    .video-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.3);
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

    /* Video Panel */
    .video-panel {
      background: #1a1a1a;
      padding: 15px;
      display: none;
      max-height: 300px;
      overflow-y: auto;
    }

    .video-panel.active {
      display: block;
    }

    .video-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .video-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }

    .video-btn:hover {
      background: #5568d3;
    }

    .video-btn.active {
      background: #10b981;
    }

    .video-btn.danger {
      background: #ef4444;
    }

    .video-btn.danger:hover {
      background: #dc2626;
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }

    .video-wrapper {
      position: relative;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 16/9;
    }

    .video-wrapper video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-label {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .muted-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* Main Content */
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
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
        <div class="header-left">
          <h1>Ollama Realtime Chat</h1>
          <button class="video-toggle-btn" id="videoToggleBtn">📹 Video</button>
        </div>
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

    <div class="video-panel" id="videoPanel">
      <div class="video-controls">
        <button class="video-btn" id="startCameraBtn">📷 Start Camera</button>
        <button class="video-btn" id="toggleMicBtn">🎤 Mute</button>
        <button class="video-btn" id="snapshotBtn">📸 Snapshot</button>
        <button class="video-btn" id="screenShareBtn">🖥️ Share Screen</button>
        <button class="video-btn danger" id="stopVideoBtn">⏹️ Stop</button>
      </div>
      <div class="video-grid" id="videoGrid">
        <!-- Videos will be added here dynamically -->
      </div>
    </div>

    <div class="main-content">
      <div class="chat-container" id="chatContainer">
        <div class="system-message">
          Welcome to Ollama Realtime Chat - Multi-Model Edition with Video Chat
        </div>
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
          <button id="attachButton" title="Attach files">📎 Attach</button>
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

const APP_JS = `// WebSocket and WebRTC globals
let ws = null;
let isStreaming = false;
let currentAssistantMessage = null;
let sessionId = null;
let selectedModel = 'deepseek-v3.1:671b-cloud';
let attachedFiles = [];
let availableModels = [];

// Video chat globals
let localStream = null;
let screenStream = null;
let peerConnections = new Map(); // peerId -> RTCPeerConnection
let isVideoActive = false;
let isMicMuted = false;

// ICE servers configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

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

// Video elements
const videoToggleBtn = document.getElementById('videoToggleBtn');
const videoPanel = document.getElementById('videoPanel');
const videoGrid = document.getElementById('videoGrid');
const startCameraBtn = document.getElementById('startCameraBtn');
const toggleMicBtn = document.getElementById('toggleMicBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const stopVideoBtn = document.getElementById('stopVideoBtn');

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

    // Announce presence for WebRTC
    ws.send(JSON.stringify({
      type: 'presence',
      peerId: getSessionId()
    }));
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
async function handleMessage(data) {
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

    // WebRTC signaling messages
    case 'peer-joined':
      handlePeerJoined(data.peerId);
      break;

    case 'peer-left':
      handlePeerLeft(data.peerId);
      break;

    case 'webrtc-offer':
      await handleOffer(data.peerId, data.offer);
      break;

    case 'webrtc-answer':
      await handleAnswer(data.peerId, data.answer);
      break;

    case 'webrtc-ice':
      await handleIceCandidate(data.peerId, data.candidate);
      break;
  }
}

// WebRTC: Handle peer joined
async function handlePeerJoined(peerId) {
  if (peerId === getSessionId()) return; // Ignore self

  console.log('Peer joined:', peerId);
  addSystemMessage(\`User \${peerId.substring(0, 8)} joined the video chat\`);

  if (localStream && isVideoActive) {
    // Create offer for new peer
    await createPeerConnection(peerId, true);
  }
}

// WebRTC: Handle peer left
function handlePeerLeft(peerId) {
  console.log('Peer left:', peerId);
  addSystemMessage(\`User \${peerId.substring(0, 8)} left the video chat\`);

  // Close peer connection
  const pc = peerConnections.get(peerId);
  if (pc) {
    pc.close();
    peerConnections.delete(peerId);
  }

  // Remove video element
  const videoElement = document.getElementById(\`video-\${peerId}\`);
  if (videoElement) {
    videoElement.remove();
  }
}

// WebRTC: Create peer connection
async function createPeerConnection(peerId, createOffer = false) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
  }

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'webrtc-ice',
        peerId: peerId,
        candidate: event.candidate
      }));
    }
  };

  // Handle remote stream
  pc.ontrack = (event) => {
    console.log('Received remote track from', peerId);
    const remoteStream = event.streams[0];
    addRemoteVideo(peerId, remoteStream);
  };

  pc.onconnectionstatechange = () => {
    console.log(\`Connection state with \${peerId}: \${pc.connectionState}\`);
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      handlePeerLeft(peerId);
    }
  };

  peerConnections.set(peerId, pc);

  if (createOffer) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({
        type: 'webrtc-offer',
        peerId: peerId,
        offer: offer
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  return pc;
}

// WebRTC: Handle offer
async function handleOffer(peerId, offer) {
  console.log('Received offer from', peerId);

  const pc = await createPeerConnection(peerId, false);

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    ws.send(JSON.stringify({
      type: 'webrtc-answer',
      peerId: peerId,
      answer: answer
    }));
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

// WebRTC: Handle answer
async function handleAnswer(peerId, answer) {
  console.log('Received answer from', peerId);

  const pc = peerConnections.get(peerId);
  if (pc) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }
}

// WebRTC: Handle ICE candidate
async function handleIceCandidate(peerId, candidate) {
  const pc = peerConnections.get(peerId);
  if (pc) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
}

// Video: Add remote video element
function addRemoteVideo(peerId, stream) {
  // Remove existing video if any
  let videoWrapper = document.getElementById(\`video-\${peerId}\`);

  if (!videoWrapper) {
    videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.id = \`video-\${peerId}\`;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = \`User \${peerId.substring(0, 8)}\`;

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(label);
    videoGrid.appendChild(videoWrapper);
  }

  const video = videoWrapper.querySelector('video');
  video.srcObject = stream;
}

// Video: Start camera
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true
    });

    // Add local video
    const localVideoWrapper = document.createElement('div');
    localVideoWrapper.className = 'video-wrapper';
    localVideoWrapper.id = 'video-local';

    const localVideo = document.createElement('video');
    localVideo.autoplay = true;
    localVideo.muted = true; // Mute local audio to prevent feedback
    localVideo.playsInline = true;
    localVideo.srcObject = localStream;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = 'You (Local)';

    localVideoWrapper.appendChild(localVideo);
    localVideoWrapper.appendChild(label);
    videoGrid.insertBefore(localVideoWrapper, videoGrid.firstChild);

    isVideoActive = true;
    startCameraBtn.textContent = '📷 Camera On';
    startCameraBtn.classList.add('active');

    // Notify server about video start
    ws.send(JSON.stringify({
      type: 'video-started',
      peerId: getSessionId()
    }));

    addSystemMessage('Camera started - You are now visible to other participants');
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('Could not access camera: ' + error.message);
  }
}

// Video: Stop camera
function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  const localVideo = document.getElementById('video-local');
  if (localVideo) {
    localVideo.remove();
  }

  // Close all peer connections
  peerConnections.forEach((pc, peerId) => {
    pc.close();
  });
  peerConnections.clear();

  isVideoActive = false;
  startCameraBtn.textContent = '📷 Start Camera';
  startCameraBtn.classList.remove('active');

  ws.send(JSON.stringify({
    type: 'video-stopped',
    peerId: getSessionId()
  }));

  addSystemMessage('Camera stopped');
}

// Video: Toggle microphone
function toggleMicrophone() {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    isMicMuted = !audioTrack.enabled;

    toggleMicBtn.textContent = isMicMuted ? '🎤 Unmute' : '🎤 Mute';
    toggleMicBtn.classList.toggle('danger', isMicMuted);

    addSystemMessage(isMicMuted ? 'Microphone muted' : 'Microphone unmuted');
  }
}

// Video: Capture snapshot
async function captureSnapshot() {
  if (!localStream) {
    alert('Please start your camera first');
    return;
  }

  const video = document.querySelector('#video-local video');
  if (!video) return;

  // Create canvas and capture frame
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

  // Add to attached files
  attachedFiles.push({
    name: \`snapshot_\${Date.now()}.jpg\`,
    type: 'image/jpeg',
    size: dataUrl.length,
    data: dataUrl
  });

  updateAttachedFilesPreview();
  addSystemMessage('Snapshot captured and attached - ready to send to AI');
}

// Video: Start screen share
async function startScreenShare() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    // Replace video track in peer connections
    const videoTrack = screenStream.getVideoTracks()[0];

    peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    // Update local video
    const localVideo = document.querySelector('#video-local video');
    if (localVideo) {
      localVideo.srcObject = screenStream;
    }

    screenShareBtn.textContent = '🖥️ Stop Sharing';
    screenShareBtn.classList.add('active');

    // When screen sharing stops
    videoTrack.onended = () => {
      stopScreenShare();
    };

    addSystemMessage('Screen sharing started');
  } catch (error) {
    console.error('Error starting screen share:', error);
    if (error.name !== 'NotAllowedError') {
      alert('Could not start screen sharing: ' + error.message);
    }
  }
}

// Video: Stop screen share
function stopScreenShare() {
  if (!screenStream) return;

  screenStream.getTracks().forEach(track => track.stop());
  screenStream = null;

  // Restore camera in peer connections
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];

    peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    // Update local video
    const localVideo = document.querySelector('#video-local video');
    if (localVideo) {
      localVideo.srcObject = localStream;
    }
  }

  screenShareBtn.textContent = '🖥️ Share Screen';
  screenShareBtn.classList.remove('active');

  addSystemMessage('Screen sharing stopped');
}

// Chat functions
function addMessage(role, content, files = []) {
  const messageDiv = document.createElement('div');
  messageDiv.className = \`message \${role}\`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;

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
          <span>\${getFileIcon(file.type)}</span>
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

function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('text')) return '📝';
  return '📎';
}

function addSystemMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.textContent = content;
  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

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

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// File handling
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

    reader.readAsDataURL(file);
  }

  fileInput.value = '';
});

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

  document.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      attachedFiles.splice(index, 1);
      updateAttachedFilesPreview();
    });
  });
}

function sendMessage() {
  const message = messageInput.value.trim();

  if ((!message && attachedFiles.length === 0) || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  addMessage('user', message || '(files attached)', [...attachedFiles]);

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

  messageInput.value = '';
  messageInput.style.height = 'auto';
  attachedFiles = [];
  updateAttachedFilesPreview();
}

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

// Event listeners
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

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

// Video control event listeners
videoToggleBtn.addEventListener('click', () => {
  videoPanel.classList.toggle('active');
  videoToggleBtn.textContent = videoPanel.classList.contains('active') ? '📹 Hide Video' : '📹 Video';
});

startCameraBtn.addEventListener('click', () => {
  if (isVideoActive) {
    stopCamera();
  } else {
    startCamera();
  }
});

toggleMicBtn.addEventListener('click', toggleMicrophone);
snapshotBtn.addEventListener('click', captureSnapshot);

screenShareBtn.addEventListener('click', () => {
  if (screenStream) {
    stopScreenShare();
  } else {
    startScreenShare();
  }
});

stopVideoBtn.addEventListener('click', stopCamera);

// Initialize
loadModels();
connect();
`;
