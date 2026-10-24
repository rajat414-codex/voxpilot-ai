/**
 * VoxPilot AI - Main Application Coordinator
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const orbContainer = document.getElementById('orb-container');
  const quantumOrb = document.getElementById('quantum-orb');
  const transcriptEl = document.getElementById('transcript-text');
  const actionBadge = document.getElementById('action-badge');
  const commandInput = document.getElementById('command-input');
  const sendBtn = document.getElementById('send-btn');
  const terminalLogs = document.getElementById('terminal-logs');
  const backendStatusPill = document.getElementById('backend-status');
  const langButtons = document.querySelectorAll('.lang-btn');
  const quickCards = document.querySelectorAll('.quick-card');

  // Initialize Visualizer
  const visualizer = new AudioVisualizer('visualizer-canvas');

  // Terminal Logger Helper
  function logTerminal(message, type = 'normal') {
    if (!terminalLogs) return;
    const line = document.createElement('div');
    line.className = `terminal-log-line ${type}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.textContent = `[${timestamp}] ${message}`;
    terminalLogs.appendChild(line);
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
  }

  logTerminal('VoxPilot AI Engine Initialized.', 'cyan');
  logTerminal('Ready to receive voice commands in Hindi, English, & Hinglish.', 'green');

  // Initialize Speech Engine
  const speech = new SpeechEngine(
    // On transcript received
    (data) => {
      if (transcriptEl) {
        transcriptEl.textContent = data.text;
        transcriptEl.classList.remove('transcript-placeholder');
      }

      if (data.isFinal && data.text.trim().length > 0) {
        logTerminal(`Recognized: "${data.text}"`, 'purple');
        executeVoiceCommand(data.text);
      }
    },
    // On state changed
    (state) => {
      visualizer.setState(state);

      quantumOrb.classList.remove('listening', 'processing', 'speaking');
      if (state !== 'idle') {
        quantumOrb.classList.add(state);
      }
    }
  );

  // Microphone stream attachment to visualizer
  let micStreamInitialized = false;
  async function requestMicrophone() {
    if (micStreamInitialized) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await visualizer.attachMicrophoneStream(stream);
      micStreamInitialized = true;
      logTerminal('Microphone attached to reactive visualizer.', 'green');
    } catch (err) {
      console.warn('Microphone permission or access error:', err);
      logTerminal('Microphone access warning: ' + err.message, 'yellow');
    }
  }

  // Toggle listening when clicking the central orb
  orbContainer.addEventListener('click', async () => {
    await requestMicrophone();
    speech.toggleListening();
  });

  // Language buttons
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      speech.setLanguage(lang);
      logTerminal(`Switched language mode: ${lang}`, 'cyan');
    });
  });

  // Send typed input
  function handleManualSubmit() {
    const text = commandInput.value.trim();
    if (!text) return;
    commandInput.value = '';
    if (transcriptEl) {
      transcriptEl.textContent = text;
      transcriptEl.classList.remove('transcript-placeholder');
    }
    logTerminal(`Manual input: "${text}"`, 'purple');
    executeVoiceCommand(text);
  }

  sendBtn.addEventListener('click', handleManualSubmit);
  commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleManualSubmit();
  });

  // Quick capability cards click handlers
  quickCards.forEach(card => {
    card.addEventListener('click', () => {
      const sampleText = card.dataset.command;
      if (sampleText) {
        if (transcriptEl) {
          transcriptEl.textContent = sampleText;
          transcriptEl.classList.remove('transcript-placeholder');
        }
        logTerminal(`Quick card triggered: "${sampleText}"`, 'purple');
        executeVoiceCommand(sampleText);
      }
    });
  });

  // Backend Status Check
  async function checkBackendStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (backendStatusPill) {
          backendStatusPill.innerHTML = `
            <div class="pulse-dot"></div>
            <span>Backend Online (${data.ollama_connected ? 'Ollama + NLP' : 'Smart NLP Engine'})</span>
          `;
        }
      }
    } catch (e) {
      if (backendStatusPill) {
        backendStatusPill.innerHTML = `
          <div class="pulse-dot offline"></div>
          <span>Local Hybrid Mode</span>
        `;
      }
    }
  }

  checkBackendStatus();
  setInterval(checkBackendStatus, 10000);

  // Command Execution (Calls Backend REST API with automatic client-side fallback)
  async function executeVoiceCommand(text) {
    visualizer.setState('processing');
    quantumOrb.classList.remove('listening');
    quantumOrb.classList.add('processing');

    logTerminal(`Processing NLP intent for: "${text}"...`, 'cyan');

    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, use_ollama: false })
      });

      if (response.ok) {
        const result = await response.json();
        handleExecutionSuccess(result);
        return;
      }
    } catch (err) {
      console.warn('Backend call failed, using client-side execution fallback:', err);
    }

    // Client-side execution fallback
    handleClientSideFallback(text);
  }

  function handleExecutionSuccess(result) {
    const intent = result.intent || {};
    const voiceMsg = result.voice_response || 'Task completed!';

    logTerminal(`Intent: ${intent.action || 'Unknown'} on ${intent.platform || 'General'}`, 'green');
    if (result.automation && result.automation.message) {
      logTerminal(`Automation: ${result.automation.message}`, 'cyan');
    }

    // Show badge
    if (actionBadge) {
      actionBadge.textContent = `⚡ ${intent.action || 'EXECUTED'}: ${intent.platform || 'System'}`;
      actionBadge.classList.add('show');
      setTimeout(() => actionBadge.classList.remove('show'), 5000);
    }

    // Speak confirmation
    speech.speak(voiceMsg);
  }

  function handleClientSideFallback(text) {
    const lower = text.toLowerCase();
    let voiceMsg = 'Opening your request...';

    if (lower.includes('youtube') || lower.includes('chalao') || lower.includes('bajao') || lower.includes('play')) {
      const query = text.replace(/play|chalao|bajao|sunao|on youtube|youtube pe|youtube/gi, '').trim();
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query || 'music')}`;
      window.open(url, '_blank');
      voiceMsg = `YouTube par ${query} chala raha hoon!`;
      logTerminal(`Opened YouTube for: ${query}`, 'green');
    } else if (lower.includes('gmail') || lower.includes('mail')) {
      window.open('https://mail.google.com/mail/u/0/?fs=1&tf=cm', '_blank');
      voiceMsg = 'Gmail compose khol raha hoon!';
      logTerminal('Opened Gmail Compose', 'green');
    } else {
      const query = text.replace(/google|search|dhoondo/gi, '').trim();
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      voiceMsg = `Google par search kar raha hoon: ${query}`;
      logTerminal(`Searched Google for: ${query}`, 'green');
    }

    if (actionBadge) {
      actionBadge.textContent = `⚡ CLIENT_DISPATCH: Web`;
      actionBadge.classList.add('show');
      setTimeout(() => actionBadge.classList.remove('show'), 4000);
    }

    speech.speak(voiceMsg);
  }
});
