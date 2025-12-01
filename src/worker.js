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

    if (url.pathname === '/manifest.json') {
      return new Response(MANIFEST, {
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    if (url.pathname === '/sw.js') {
      return new Response(SERVICE_WORKER, {
        headers: { 'Content-Type': 'application/javascript;charset=UTF-8' }
      });
    }

    if (url.pathname === '/favicon.ico') {
      // Fetch favicon from GitHub
      return fetch('https://raw.githubusercontent.com/whobcode/logos/main/logohead.png');
    }

    if (url.pathname === '/icon-192.png' || url.pathname === '/icon-512.png') {
      // Use the same favicon from GitHub for PWA icons
      return fetch('https://raw.githubusercontent.com/whobcode/logos/main/logohead.png');
    }

    return new Response('Not Found', { status: 404 });
  }
};

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta name="theme-color" content="#DC143C">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Ollama Chat">
  <meta name="description" content="Realtime AI chat with multi-model support and video capabilities">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/png" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/favicon.ico">
  <title>Ollama Realtime Chat - Multi-Model with Video</title>
  <style>
    :root {
      --bg-gradient-start: #1a1a1a;
      --bg-gradient-end: #2d1a1a;
      --container-bg: white;
      --text-primary: #000000;
      --text-secondary: #6b7280;
      --chat-bg: #f9fafb;
      --message-bg: white;
      --user-message-bg: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
      --input-bg: white;
      --input-border: #e5e7eb;
      --input-border-focus: #B8860B;
      --header-bg: linear-gradient(135deg, #DC143C 0%, #B8860B 100%);
      --system-message-bg: #2d2416;
      --system-message-text: #B8860B;
      --shadow: rgba(0, 0, 0, 0.1);
      --border-color: #e5e7eb;
    }

    [data-theme="dark"] {
      --bg-gradient-start: #0a0a0a;
      --bg-gradient-end: #1a0a0a;
      --container-bg: #1e1e1e;
      --text-primary: #e5e5e5;
      --text-secondary: #a0a0a0;
      --chat-bg: #262626;
      --message-bg: #2d2d2d;
      --user-message-bg: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
      --input-bg: #2d2d2d;
      --input-border: #3d3d3d;
      --input-border-focus: #B8860B;
      --header-bg: linear-gradient(135deg, #DC143C 0%, #B8860B 100%);
      --system-message-bg: #1a1410;
      --system-message-text: #B8860B;
      --shadow: rgba(0, 0, 0, 0.3);
      --border-color: #3d3d3d;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      color: var(--text-primary);
      transition: background 0.3s ease;
    }

    .container {
      width: 100%;
      max-width: 1200px;
      height: 95vh;
      background: var(--container-bg);
      border-radius: 20px;
      box-shadow: 0 20px 60px var(--shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: background 0.3s ease;
    }

    .header {
      background: var(--header-bg);
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
      background: #B8860B;
      animation: pulse 2s infinite;
    }

    .status-dot.disconnected {
      background: #DC143C;
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
      background: #DC143C;
      color: white;
    }

    .search-container {
      position: relative;
      margin-top: 10px;
    }

    #searchInput {
      width: 100%;
      padding: 8px 35px 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 8px;
      font-size: 13px;
      transition: all 0.3s;
    }

    #searchInput::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    #searchInput:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .clear-search-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .search-highlight {
      background: #FFD700;
      color: #000;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 600;
    }

    .message.search-match {
      box-shadow: 0 0 0 2px #B8860B;
      animation: highlightPulse 0.5s ease-in-out;
    }

    @keyframes highlightPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
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
      background: #DC143C;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }

    .video-btn:hover {
      background: #B22222;
    }

    .video-btn.active {
      background: #B8860B;
    }

    .video-btn.danger {
      background: #8B0000;
    }

    .video-btn.danger:hover {
      background: #660000;
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      max-height: 100%;
    }

    .video-grid:has(.video-wrapper:nth-child(3)) {
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    }

    .video-grid:has(.video-wrapper:nth-child(5)) {
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    }

    .video-wrapper {
      position: relative;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 16/9;
      max-width: 180px;
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
      background: rgba(220, 20, 60, 0.9);
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
      background: var(--chat-bg);
      transition: background 0.3s ease;
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
      background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
    }

    .message.assistant .message-avatar {
      background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%);
    }

    .message-content {
      background: var(--message-bg);
      padding: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px var(--shadow);
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-width: 100%;
      color: var(--text-primary);
      transition: all 0.3s ease;
    }

    .message.user .message-content {
      background: var(--user-message-bg);
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

    .message-reactions {
      display: flex;
      gap: 4px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .reaction {
      background: var(--chat-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }

    .reaction:hover {
      transform: scale(1.1);
      background: var(--system-message-bg);
    }

    .reaction.active {
      background: var(--system-message-text);
      color: white;
      border-color: var(--system-message-text);
    }

    .reaction-count {
      font-weight: 600;
      font-size: 11px;
    }

    .add-reaction-btn {
      background: transparent;
      border: 1px dashed var(--border-color);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 0.6;
    }

    .add-reaction-btn:hover {
      opacity: 1;
      background: var(--chat-bg);
    }

    .reaction-picker {
      position: absolute;
      background: var(--container-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 4px 12px var(--shadow);
      display: none;
      gap: 4px;
      z-index: 1000;
      margin-top: 4px;
    }

    .reaction-picker.active {
      display: flex;
    }

    .reaction-option {
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .reaction-option:hover {
      background: var(--chat-bg);
      transform: scale(1.2);
    }

    .system-message {
      text-align: center;
      padding: 12px;
      background: var(--system-message-bg);
      border-radius: 12px;
      font-size: 13px;
      color: var(--system-message-text);
      align-self: center;
      transition: all 0.3s ease;
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
      background: #B8860B;
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
      background: var(--container-bg);
      border-top: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }

    .attached-files-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
    }

    .attached-file-item {
      background: var(--chat-bg);
      padding: 8px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-primary);
      transition: all 0.3s ease;
    }

    .remove-file {
      background: #DC143C;
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
      border: 2px solid var(--input-border);
      border-radius: 12px;
      font-size: 15px;
      font-family: inherit;
      transition: all 0.3s;
      resize: none;
      min-height: 50px;
      max-height: 120px;
      background: var(--input-bg);
      color: var(--text-primary);
    }

    #messageInput:focus {
      outline: none;
      border-color: var(--input-border-focus);
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
      background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
    }

    #sendButton:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 20, 60, 0.4);
    }

    #sendButton:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #attachButton {
      background: #B8860B;
    }

    #attachButton:hover {
      background: #8B6914;
    }

    #clearButton {
      background: #8B0000;
    }

    #clearButton:hover {
      background: #660000;
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

    .drag-drop-zone {
      border: 2px dashed #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      margin-bottom: 12px;
      transition: all 0.3s;
      display: none;
    }

    .drag-drop-zone.active {
      display: block;
    }

    .drag-drop-zone.dragover {
      border-color: #B8860B;
      background: rgba(184, 134, 11, 0.05);
      color: #B8860B;
    }

    /* Mobile Responsiveness - Tablets */
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }

      .container {
        max-width: 100%;
        height: 100vh;
        border-radius: 12px;
      }

      .header {
        padding: 12px 20px;
      }

      .header h1 {
        font-size: 18px;
      }

      .model-selector {
        flex-wrap: wrap;
      }

      .model-selector select {
        min-width: 160px;
        font-size: 12px;
      }

      .video-panel {
        max-height: 250px;
      }

      .video-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .chat-container {
        padding: 20px;
        gap: 15px;
      }

      .message {
        max-width: 85%;
      }

      .input-container {
        padding: 15px 20px;
      }

      button {
        padding: 10px 16px;
        font-size: 13px;
      }
    }

    /* Mobile Responsiveness - Phones */
    @media (max-width: 480px) {
      body {
        padding: 0;
      }

      .container {
        height: 100vh;
        border-radius: 0;
        max-width: 100%;
      }

      .header {
        padding: 10px 15px;
      }

      .header-top {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 10px;
      }

      .header-left {
        width: 100%;
        justify-content: space-between;
      }

      .header h1 {
        font-size: 16px;
      }

      .video-toggle-btn {
        font-size: 11px;
        padding: 5px 10px;
      }

      .status {
        font-size: 12px;
      }

      .model-selector {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      .model-selector label {
        font-size: 12px;
      }

      .model-selector select {
        width: 100%;
        min-width: 100%;
        font-size: 12px;
        padding: 8px 12px;
      }

      .video-panel {
        padding: 10px;
        max-height: 200px;
      }

      .video-controls {
        gap: 6px;
      }

      .video-btn {
        flex: 1;
        min-width: calc(50% - 3px);
        padding: 10px 8px;
        font-size: 11px;
        white-space: nowrap;
      }

      .video-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .chat-container {
        padding: 15px;
        gap: 12px;
      }

      .message {
        max-width: 90%;
        gap: 8px;
      }

      .message-avatar {
        width: 30px;
        height: 30px;
        font-size: 12px;
      }

      .message-content {
        padding: 10px 14px;
        font-size: 14px;
        border-radius: 12px;
      }

      .attached-image {
        max-width: 150px;
        max-height: 150px;
      }

      .system-message {
        font-size: 12px;
        padding: 10px;
      }

      .input-container {
        padding: 12px 15px;
      }

      .input-row {
        flex-direction: column;
        gap: 8px;
      }

      .controls {
        width: 100%;
        gap: 6px;
      }

      #messageInput {
        font-size: 14px;
        padding: 12px 16px;
        min-height: 44px;
      }

      button {
        flex: 1;
        padding: 12px 16px;
        font-size: 13px;
        border-radius: 10px;
        min-height: 44px;
      }

      .attached-files-preview {
        gap: 8px;
        margin-bottom: 10px;
      }

      .attached-file-item {
        font-size: 12px;
        padding: 6px 10px;
      }
    }

    /* Touch-friendly improvements */
    @media (hover: none) and (pointer: coarse) {
      button, .video-btn, .remove-file, .video-toggle-btn {
        min-height: 44px;
        min-width: 44px;
      }

      .model-selector select {
        min-height: 44px;
      }

      #messageInput {
        min-height: 44px;
      }
    }

    /* Landscape mode on mobile */
    @media (max-width: 768px) and (orientation: landscape) {
      .container {
        height: 100vh;
      }

      .video-panel {
        max-height: 150px;
      }

      .video-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .chat-container {
        padding: 15px;
      }
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
          <button class="video-toggle-btn" id="darkModeToggle">🌙 Dark</button>
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
      <div class="search-container">
        <input type="text" id="searchInput" placeholder="🔍 Search messages...">
        <button id="clearSearchBtn" class="clear-search-btn" style="display: none;">✕</button>
      </div>
    </div>

    <div class="video-panel" id="videoPanel">
      <div class="video-controls">
        <button class="video-btn" id="startCameraBtn">📷 Start Camera</button>
        <button class="video-btn" id="toggleMicBtn">🎤 Mute</button>
        <button class="video-btn" id="snapshotBtn">📸 Snapshot</button>
        <button class="video-btn" id="screenShareBtn">🖥️ Share Screen</button>
        <select class="video-btn" id="qualitySelect" style="background: #B8860B; color: white;">
          <option value="sd">📹 SD (480p)</option>
          <option value="hd" selected>📹 HD (720p)</option>
          <option value="fhd">📹 Full HD (1080p)</option>
        </select>
        <button class="video-btn" id="pipBtn">📺 PiP</button>
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
      <div id="dragDropZone" class="drag-drop-zone">
        📎 Drop files here or tap to select
      </div>
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

      <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.json,.csv,.md" capture="environment">
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
let conversationHistory = [];

// Video chat globals
let localStream = null;
let screenStream = null;
let peerConnections = new Map(); // peerId -> RTCPeerConnection
let isVideoActive = false;
let isMicMuted = false;
let currentQuality = 'hd';

// Video quality presets
const VIDEO_QUALITY = {
  sd: { width: 640, height: 480, frameRate: 15, bitrate: 300000 },
  hd: { width: 1280, height: 720, frameRate: 30, bitrate: 1000000 },
  fhd: { width: 1920, height: 1080, frameRate: 30, bitrate: 2500000 }
};

// Notification settings
let notificationsEnabled = localStorage.getItem('notifications') !== 'false';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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
const dragDropZone = document.getElementById('dragDropZone');
const darkModeToggle = document.getElementById('darkModeToggle');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Video elements
const videoToggleBtn = document.getElementById('videoToggleBtn');
const videoPanel = document.getElementById('videoPanel');
const videoGrid = document.getElementById('videoGrid');
const startCameraBtn = document.getElementById('startCameraBtn');
const toggleMicBtn = document.getElementById('toggleMicBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const stopVideoBtn = document.getElementById('stopVideoBtn');
const qualitySelect = document.getElementById('qualitySelect');
const pipBtn = document.getElementById('pipBtn');

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
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${window.location.host}/ws?session=\${getSessionId()}\`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to server');
      updateStatus('connected', 'Connected');
      sendButton.disabled = false;

      try {
        // Announce presence for WebRTC
        ws.send(JSON.stringify({
          type: 'presence',
          peerId: getSessionId()
        }));
      } catch (error) {
        console.error('Error sending presence:', error);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error handling message:', error);
        addSystemMessage('Error processing server message');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateStatus('disconnected', 'Connection Error');
      addSystemMessage('Connection error - will retry...');
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
  } catch (error) {
    console.error('Fatal connection error:', error);
    addSystemMessage('Fatal error: Could not establish connection');
    updateStatus('disconnected', 'Fatal Error');
  }
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
        playNotificationSound(); // Play sound when AI starts responding
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

  // Add local tracks with mobile optimization
  if (localStream) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    localStream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, localStream);

      // Apply bandwidth limitations on mobile
      if (isMobile && track.kind === 'video') {
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        // Limit to 500 kbps on mobile for better performance
        parameters.encodings[0].maxBitrate = 500000;
        sender.setParameters(parameters).catch(err =>
          console.log('Failed to set parameters:', err)
        );
      }
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

    // Add touch controls to video
    addVideoTouchControls(videoWrapper);
  }

  const video = videoWrapper.querySelector('video');
  video.srcObject = stream;
}

// Touch controls for video elements
function addVideoTouchControls(videoWrapper) {
  let lastTap = 0;
  let initialDistance = 0;
  let currentScale = 1;
  let touchStartX = 0;
  let touchStartY = 0;

  const video = videoWrapper.querySelector('video');

  // Double-tap to toggle fullscreen
  videoWrapper.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (videoWrapper.requestFullscreen) {
        videoWrapper.requestFullscreen();
      } else if (videoWrapper.webkitRequestFullscreen) {
        videoWrapper.webkitRequestFullscreen();
      }
    }

    lastTap = currentTime;
  });

  // Pinch to zoom
  videoWrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  });

  videoWrapper.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      currentScale = Math.min(Math.max(scale, 0.5), 3);

      video.style.transform = \`scale(\${currentScale})\`;
      video.style.transition = 'transform 0.1s';
    }
  });

  videoWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length === 0 && currentScale !== 1) {
      // Reset zoom on release
      setTimeout(() => {
        video.style.transform = 'scale(1)';
        video.style.transition = 'transform 0.3s';
        currentScale = 1;
      }, 200);
    }
  });

  // Helper function to calculate distance between two touch points
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Video: Start camera
async function startCamera() {
  try {
    // Get quality settings
    const quality = VIDEO_QUALITY[currentQuality] || VIDEO_QUALITY.hd;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Use lower quality on mobile
    const effectiveQuality = isMobile ? VIDEO_QUALITY.sd : quality;

    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: effectiveQuality.width },
        height: { ideal: effectiveQuality.height },
        frameRate: { ideal: effectiveQuality.frameRate }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
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

    // Add touch controls to local video
    addVideoTouchControls(localVideoWrapper);

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

// Conversation history management
function saveConversationHistory() {
  try {
    const history = {
      messages: conversationHistory,
      timestamp: Date.now(),
      model: selectedModel
    };
    localStorage.setItem('conversation_history', JSON.stringify(history));
  } catch (error) {
    console.log('Could not save conversation history:', error);
  }
}

function loadConversationHistory() {
  try {
    const saved = localStorage.getItem('conversation_history');
    if (saved) {
      const history = JSON.parse(saved);
      // Only load if less than 24 hours old
      if (Date.now() - history.timestamp < 24 * 60 * 60 * 1000) {
        conversationHistory = history.messages;
        restoreMessages();
        addSystemMessage('Conversation history restored');
      }
    }
  } catch (error) {
    console.log('Could not load conversation history:', error);
  }
}

function restoreMessages() {
  conversationHistory.forEach(msg => {
    addMessage(msg.role, msg.content, msg.files, false);
  });
}

function clearConversationCache() {
  localStorage.removeItem('conversation_history');
  conversationHistory = [];
}

// Chat functions
let messageReactions = new Map(); // Store reactions for each message

function addMessage(role, content, files = [], saveToHistory = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = \`message \${role}\`;
  const messageId = \`msg-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  messageDiv.setAttribute('data-message-id', messageId);

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
        img.dataset.src = file.data;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0"/%3E%3C/svg%3E';
        img.className = 'attached-image';
        img.alt = file.name;
        messageContent.appendChild(img);
        enableLazyLoading(img);
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

  // Add reactions container
  const reactionsContainer = document.createElement('div');
  reactionsContainer.className = 'message-reactions';
  reactionsContainer.innerHTML = \`
    <button class="add-reaction-btn" data-message-id="\${messageId}">➕</button>
  \`;
  messageContent.appendChild(reactionsContainer);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);
  chatContainer.appendChild(messageDiv);
  scrollToBottom();

  // Initialize reactions for this message
  messageReactions.set(messageId, {});

  // Add reaction picker event
  setupReactionPicker(messageId, reactionsContainer);

  // Save to conversation history
  if (saveToHistory && role !== 'system') {
    conversationHistory.push({ role, content, files });
    saveConversationHistory();
  }

  return messageContent;
}

// Reaction picker setup
const availableReactions = ['👍', '❤️', '😂', '😮', '🎉', '🚀', '👏', '🔥'];
let activeReactionPicker = null;

function setupReactionPicker(messageId, container) {
  const addBtn = container.querySelector('.add-reaction-btn');

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Close any existing picker
    if (activeReactionPicker) {
      activeReactionPicker.remove();
      activeReactionPicker = null;
    }

    // Create reaction picker
    const picker = document.createElement('div');
    picker.className = 'reaction-picker active';

    availableReactions.forEach(emoji => {
      const option = document.createElement('span');
      option.className = 'reaction-option';
      option.textContent = emoji;
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        addReaction(messageId, emoji);
        picker.remove();
        activeReactionPicker = null;
      });
      picker.appendChild(option);
    });

    container.appendChild(picker);
    activeReactionPicker = picker;
  });
}

// Add reaction to message
function addReaction(messageId, emoji) {
  const reactions = messageReactions.get(messageId);

  if (reactions[emoji]) {
    reactions[emoji]++;
  } else {
    reactions[emoji] = 1;
  }

  updateReactionsDisplay(messageId);
}

// Update reactions display
function updateReactionsDisplay(messageId) {
  const messageDiv = document.querySelector(\`[data-message-id="\${messageId}"]\`);
  if (!messageDiv) return;

  const container = messageDiv.querySelector('.message-reactions');
  const reactions = messageReactions.get(messageId);

  // Clear existing reactions (keep the add button)
  const addBtn = container.querySelector('.add-reaction-btn');
  container.innerHTML = '';

  // Add reactions
  Object.entries(reactions).forEach(([emoji, count]) => {
    if (count > 0) {
      const reaction = document.createElement('span');
      reaction.className = 'reaction';
      reaction.innerHTML = \`
        <span>\${emoji}</span>
        <span class="reaction-count">\${count}</span>
      \`;
      reaction.addEventListener('click', () => {
        // Toggle reaction
        if (reactions[emoji] > 0) {
          reactions[emoji]--;
          if (reactions[emoji] === 0) {
            delete reactions[emoji];
          }
          updateReactionsDisplay(messageId);
        }
      });
      container.appendChild(reaction);
    }
  });

  // Re-add the add button
  container.appendChild(addBtn);
}

// Close reaction picker when clicking outside
document.addEventListener('click', () => {
  if (activeReactionPicker) {
    activeReactionPicker.remove();
    activeReactionPicker = null;
  }
});

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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images before compression

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.8 quality
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

async function handleFiles(files) {
  for (const file of files) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      addSystemMessage(\`Error: \${file.name} is too large (max 10MB). File skipped.\`);
      continue;
    }

    let processedFile = file;

    // Compress images if needed
    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
      addSystemMessage(\`Compressing \${file.name}...\`);
      const compressed = await compressImage(file);
      processedFile = new File([compressed], file.name, { type: 'image/jpeg' });
      const savedSize = ((file.size - compressed.size) / file.size * 100).toFixed(1);
      addSystemMessage(\`Compressed \${file.name} (saved \${savedSize}%)\`);
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      attachedFiles.push({
        name: processedFile.name,
        type: processedFile.type,
        size: processedFile.size,
        data: event.target.result
      });

      updateAttachedFilesPreview();
    };

    reader.readAsDataURL(processedFile);
  }
}

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  await handleFiles(files);
  fileInput.value = '';
});

// Drag and drop functionality
dragDropZone.addEventListener('click', () => {
  fileInput.click();
});

dragDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragDropZone.classList.add('dragover');
});

dragDropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragDropZone.classList.remove('dragover');
});

dragDropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDropZone.classList.remove('dragover');

  const files = Array.from(e.dataTransfer.files);
  await handleFiles(files);
});

// Show drag-drop zone on file attach
let dragDropVisible = false;
attachButton.addEventListener('click', () => {
  if (!dragDropVisible) {
    dragDropZone.classList.add('active');
    dragDropVisible = true;
  } else {
    fileInput.click();
  }
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
  clearConversationCache();
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

// Quality selector
qualitySelect.addEventListener('change', (e) => {
  currentQuality = e.target.value;
  addSystemMessage(\`Video quality set to \${e.target.options[e.target.selectedIndex].text}\`);

  // Restart camera if active
  if (isVideoActive) {
    stopCamera();
    setTimeout(() => startCamera(), 500);
  }
});

// Picture-in-Picture
pipBtn.addEventListener('click', async () => {
  const localVideo = document.querySelector('#video-local video');
  if (!localVideo) {
    alert('Please start your camera first');
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      pipBtn.textContent = '📺 PiP';
    } else {
      await localVideo.requestPictureInPicture();
      pipBtn.textContent = '📺 Exit PiP';
      addSystemMessage('Picture-in-Picture mode enabled');
    }
  } catch (error) {
    console.error('PiP error:', error);
    alert('Picture-in-Picture not supported');
  }
});

// Swipe gestures for video panel
function initializeSwipeGestures() {
  let touchStartY = 0;
  let touchEndY = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  videoPanel.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  videoPanel.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].clientY;
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeDistanceY = touchStartY - touchEndY;
    const swipeDistanceX = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    // Swipe down to close video panel
    if (swipeDistanceY < -minSwipeDistance && Math.abs(swipeDistanceX) < minSwipeDistance) {
      if (videoPanel.classList.contains('active')) {
        videoPanel.classList.remove('active');
        videoToggleBtn.textContent = '📹 Video';
      }
    }
  }
}

// Initialize swipe gestures on load
initializeSwipeGestures();

// Prevent zoom on double-tap for buttons (but allow for videos)
document.querySelectorAll('button, select, input, textarea').forEach(element => {
  element.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.target.click();
  }, { passive: false });
});

// Notification sound
function playNotificationSound() {
  if (!notificationsEnabled || !audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}

function toggleNotifications() {
  notificationsEnabled = !notificationsEnabled;
  localStorage.setItem('notifications', notificationsEnabled);
  addSystemMessage(\`Notifications \${notificationsEnabled ? 'enabled' : 'disabled'}\`);
}

// Dark mode functionality
function initDarkMode() {
  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateDarkModeButton(savedTheme);
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateDarkModeButton(newTheme);

  addSystemMessage(\`Switched to \${newTheme} mode\`);
}

function updateDarkModeButton(theme) {
  if (theme === 'dark') {
    darkModeToggle.textContent = '☀️ Light';
  } else {
    darkModeToggle.textContent = '🌙 Dark';
  }
}

// Search functionality
function searchMessages(query) {
  // Clear previous search highlights
  document.querySelectorAll('.search-highlight').forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
  document.querySelectorAll('.search-match').forEach(el => {
    el.classList.remove('search-match');
  });

  if (!query || query.length < 2) {
    clearSearchBtn.style.display = 'none';
    return;
  }

  clearSearchBtn.style.display = 'block';

  const messages = document.querySelectorAll('.message:not(.system-message)');
  let matchCount = 0;

  messages.forEach(messageDiv => {
    const content = messageDiv.querySelector('.message-content');
    if (!content) return;

    const textContent = content.childNodes[0]?.textContent || '';

    if (textContent.toLowerCase().includes(query.toLowerCase())) {
      messageDiv.classList.add('search-match');
      matchCount++;

      // Highlight matching text
      const regex = new RegExp(\`(\${escapeRegex(query)})\`, 'gi');
      const highlightedText = textContent.replace(regex, '<span class="search-highlight">$1</span>');

      // Only replace the text node, not the entire content
      if (content.childNodes[0]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = highlightedText;
        while (tempDiv.firstChild) {
          content.insertBefore(tempDiv.firstChild, content.childNodes[0]);
        }
        content.removeChild(content.childNodes[content.childNodes.length - 1]);
      }
    }
  });

  if (matchCount > 0) {
    const firstMatch = document.querySelector('.search-match');
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  addSystemMessage(\`Found \${matchCount} message\${matchCount !== 1 ? 's' : ''} matching "\${query}"\`);
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearSearch() {
  searchInput.value = '';
  searchMessages('');
  clearSearchBtn.style.display = 'none';
}

// Search event listeners
searchInput.addEventListener('input', (e) => {
  searchMessages(e.target.value);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearSearch();
  }
});

clearSearchBtn.addEventListener('click', clearSearch);

// Dark mode toggle event listener
darkModeToggle.addEventListener('click', toggleDarkMode);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Lazy loading for images
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    }
  });
}, { rootMargin: '50px' });

function enableLazyLoading(img) {
  if ('IntersectionObserver' in window) {
    imageObserver.observe(img);
  } else {
    // Fallback for older browsers
    img.src = img.dataset.src;
  }
}

// Initialize
initDarkMode();
loadModels();
loadConversationHistory();
connect();
`;

const MANIFEST = JSON.stringify({
  name: "Ollama Realtime Chat",
  short_name: "Ollama Chat",
  description: "Realtime AI chat with multi-model support and video capabilities",
  start_url: "/",
  display: "standalone",
  background_color: "#1a1a1a",
  theme_color: "#DC143C",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  categories: ["productivity", "social"],
  screenshots: []
});

const SERVICE_WORKER = `
const CACHE_NAME = 'ollama-chat-v1';
const urlsToCache = [
  '/',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Skip WebSocket requests
  if (event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC143C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" fill="url(#grad)" rx="40"/>
  <text x="96" y="130" font-family="Arial, sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">AI</text>
  <circle cx="60" cy="60" r="8" fill="white" opacity="0.8"/>
  <circle cx="132" cy="60" r="8" fill="white" opacity="0.8"/>
</svg>`;
