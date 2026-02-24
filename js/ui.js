import { detectCodeBlocks, escapeHtml, copyToClipboard } from './utils.js';
import { isPersonaMessage } from './state.js';

// elemen dom
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const notification = document.getElementById('notification');
const themeToggle = document.getElementById('themeToggle');
const particles = document.getElementById('particles');

export const elements = {
    chatLog,
    chatInput,
    sendBtn,
    typingIndicator,
    notification,
    themeToggle,
    particles
};

export function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

export function showTyping() {
    typingIndicator.style.display = 'block';
    chatLog.scrollTop = chatLog.scrollHeight;
}

export function hideTyping() {
    typingIndicator.style.display = 'none';
}

export function clearChatLog() {
    chatLog.innerHTML = '';
}

export function addMessage(content, isUser = false) {
    if (isPersonaMessage(content)) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const contentParts = detectCodeBlocks(content);

    contentParts.forEach(part => {
        if (part.type === 'code') {
            const codeBlock = createCodeBlock(part);
            contentDiv.appendChild(codeBlock);
        } else {
            const textContent = createTextContent(part.content);
            contentDiv.appendChild(textContent);
        }
    });

    bubbleDiv.appendChild(contentDiv);
    messageDiv.appendChild(bubbleDiv);
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function createCodeBlock(part) {
    const codeBlock = document.createElement('div');
    codeBlock.className = 'code-block';

    const codeHeader = document.createElement('div');
    codeHeader.className = 'code-header';

    const codeLanguage = document.createElement('span');
    codeLanguage.className = 'code-language';
    codeLanguage.textContent = part.language.toUpperCase() || 'CODE';

    const copyCodeBtn = document.createElement('button');
    copyCodeBtn.className = 'copy-code-btn';
    copyCodeBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
    Copy
  `;
    copyCodeBtn.onclick = () => {
        if (copyToClipboard(part.content)) {
            showNotification('Code copied successfully!');
        } else {
            showNotification('Failed to copy code!');
        }
    };

    codeHeader.appendChild(codeLanguage);
    codeHeader.appendChild(copyCodeBtn);

    const codeContent = document.createElement('pre');
    codeContent.textContent = part.content;
    codeContent.style.margin = '0';
    codeContent.style.whiteSpace = 'pre-wrap';
    codeContent.style.color = '#e0e0e0';
    codeContent.style.fontSize = '0.9em';
    codeContent.style.lineHeight = '1.4';
    codeContent.style.fontFamily = "'JetBrains Mono', 'Consolas', 'Monaco', monospace";

    codeBlock.appendChild(codeHeader);
    codeBlock.appendChild(codeContent);
    return codeBlock;
}

function createTextContent(content) {
    const textContent = document.createElement('div');

    let formattedContent = escapeHtml(content)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    textContent.innerHTML = '<p>' + formattedContent + '</p>';
    textContent.style.whiteSpace = 'pre-wrap';

    const div = document.createElement('div');
    div.appendChild(textContent);

    const copyTextBtn = document.createElement('button');
    copyTextBtn.className = 'copy-code-btn';
    copyTextBtn.style.marginTop = '8px';
    copyTextBtn.style.fontSize = '0.78em';
    copyTextBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copy
    `;
    copyTextBtn.onclick = () => {
        if (copyToClipboard(content)) {
            showNotification('Text copied successfully!');
        } else {
            showNotification('Failed to copy text!');
        }
    };
    div.appendChild(copyTextBtn);

    return div;
}

export function createParticles() {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255, 51, 51, 0.5)';
        particle.style.borderRadius = '50%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.boxShadow = '0 0 10px rgba(255, 51, 51, 0.5)';
        particle.style.animation = `float ${Math.random() * 10 + 10}s infinite ease-in-out`;
        particle.style.animationDelay = Math.random() * 10 + 's';
        particles.appendChild(particle);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
          50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
          75% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
        }
      `;
    document.head.appendChild(style);
}

export function renderHistorySidebar(conversationHistory, highlightCallback) {
    const list = document.getElementById('historyList');
    if (list) {
        list.innerHTML = '';
        conversationHistory.forEach((msg, idx) => {
            const text = (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
            if (isPersonaMessage(text)) return;

            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.idx = idx;

            const title = document.createElement('div');
            title.textContent = msg.role === 'user' ? 'Anda' : 'WormGPT';
            title.style.fontWeight = '700';

            const snippet = document.createElement('span');
            snippet.className = 'snippet';
            snippet.textContent = (text || '').replace(/\s+/g, ' ').trim().slice(0, 80);

            item.appendChild(title);
            item.appendChild(snippet);
            item.addEventListener('click', () => highlightCallback(idx));
            list.appendChild(item);
        });
    }

    const dropdown = document.getElementById('historyDropdownList');
    if (dropdown) {
        dropdown.innerHTML = '';
        conversationHistory.forEach((msg, idx) => {
            const text = (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
            if (isPersonaMessage(text)) return;

            const item = document.createElement('div');
            item.className = 'history-item ' + (msg.role === 'user' ? 'history-item-user' : 'history-item-ai');
            item.dataset.idx = idx;

            const roleLabel = document.createElement('div');
            roleLabel.className = 'role-label';
            roleLabel.textContent = msg.role === 'user' ? 'Anda' : 'WormGPT';

            const snippet = document.createElement('span');
            snippet.className = 'snippet';
            snippet.textContent = (text || '').replace(/\s+/g, ' ').trim().slice(0, 80);

            item.appendChild(roleLabel);
            item.appendChild(snippet);

            item.addEventListener('click', () => {
                highlightCallback(idx);
                dropdown.style.display = 'none';
                const btn = document.getElementById('historyDropdownBtn');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            });
            dropdown.appendChild(item);
        });
    }
}

export function setupThemeToggle() {
    themeToggle.addEventListener('click', function () {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeToggle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
          <span>Light Mode</span>
        `;
    } else {
        themeToggle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM6.34 5.16l-1.42 1.42c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.42-1.42c.39-.39.39-1.02 0-1.41a.9959.9959 0 0 0-1.41 0zm13.08 12.42l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.42-1.42c-.39-.39-1.02-.39-1.41 0a.9959.9959 0 0 0 0 1.41zM5.16 17.66l-1.42-1.42c-.39-.39-1.02-.39-1.41 0a.9959.9959 0 0 0 0 1.41l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41zM18.84 6.34l1.42-1.42c.39-.39.39-1.02 0-1.41a.9959.9959 0 0 0-1.41 0l-1.42 1.42c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0z"/>
          </svg>
          <span>Dark Mode</span>
        `;
    }
}
