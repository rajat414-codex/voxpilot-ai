import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, VoiceState, TerminalLog, IntentResult } from './types';
import { defaultIntentEngine } from './services/intentEngine';
import { defaultAutomationController } from './services/automation';
import { SpeechEngine } from './services/speechEngine';
import { AudioVisualizer, AudioVisualizerHandle } from './components/AudioVisualizer';
import { DesktopSimulatorModal } from './components/DesktopSimulatorModal';
import { YouTubeModal } from './components/YouTubeModal';

export const App: React.FC = () => {
  // Voice & Language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en-IN');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('');
  const [actionBadgeText, setActionBadgeText] = useState<string | null>(null);

  // Modals state
  const [activeDesktopApp, setActiveDesktopApp] = useState<string | null>(null);
  const [activeYouTubeVideo, setActiveYouTubeVideo] = useState<{ id: string; query: string } | null>(null);

  // Terminal Logs state
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'VoxPilot AI Engine Initialized.',
      type: 'cyan',
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Ready to receive voice commands in Hindi, English, & Hinglish.',
      type: 'green',
    },
  ]);

  const terminalBodyRef = useRef<HTMLDivElement | null>(null);
  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const visualizerHandleRef = useRef<AudioVisualizerHandle | null>(null);
  const micRequestedRef = useRef<boolean>(false);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'normal') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = Math.random().toString(36).substring(2, 9);
    setLogs((prev) => [...prev, { id, timestamp, message, type }]);
  }, []);

  // Scroll terminal logs to bottom on update
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Command Execution Handler
  const executeCommand = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      setVoiceState('processing');
      addLog(`Processing NLP intent for: "${clean}"...`, 'cyan');

      // Intent classification using high-accuracy multilingual rule parser
      const intent: IntentResult = defaultIntentEngine.parseIntent(clean);
      addLog(`Intent: ${intent.action} on ${intent.platform}`, 'green');

      // Execute automation
      const execResult = defaultAutomationController.execute(intent.action, intent.platform, intent.parameters);

      if (execResult.message) {
        addLog(`Automation: ${execResult.message}`, 'cyan');
      }

      // Display action badge
      const badgeTitle = `⚡ ${String(intent.action).toUpperCase()}: ${intent.platform.toUpperCase()}`;
      setActionBadgeText(badgeTitle);
      setTimeout(() => {
        setActionBadgeText(null);
      }, 5000);

      // Handle interactive modals for simulator if needed
      if (intent.action === 'launch_app') {
        const appName = intent.parameters.app || 'calculator';
        setActiveDesktopApp(appName);
      } else if (intent.action === 'play_youtube') {
        const query = intent.parameters.query || '';
        const videoId = defaultAutomationController.getYouTubeVideoId(query);
        if (videoId) {
          setActiveYouTubeVideo({ id: videoId, query });
        }
      }

      // Speak confirmation feedback in natural voice
      if (speechEngineRef.current && intent.response_text) {
        speechEngineRef.current.speak(intent.response_text);
      } else {
        setVoiceState('idle');
      }
    },
    [addLog]
  );

  // Initialize Speech Engine once
  useEffect(() => {
    const engine = new SpeechEngine(
      // On transcript
      (data) => {
        setTranscript(data.text);
        if (data.isFinal && data.text.trim().length > 0) {
          addLog(`Recognized: "${data.text}"`, 'purple');
          executeCommand(data.text);
        }
      },
      // On voice state change
      (state) => {
        setVoiceState(state);
      }
    );

    speechEngineRef.current = engine;
  }, [addLog, executeCommand]);

  // Request mic stream for visualizer
  const requestMicrophone = async () => {
    if (micRequestedRef.current) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (visualizerHandleRef.current) {
          await visualizerHandleRef.current.attachMicrophoneStream(stream);
        }
        micRequestedRef.current = true;
        addLog('Microphone attached to reactive visualizer.', 'green');
      }
    } catch (err: any) {
      console.warn('Microphone permission or access error:', err);
      addLog(`Microphone access note: ${err?.message || 'Using simulated waveform'}`, 'yellow');
    }
  };

  const handleOrbClick = async () => {
    await requestMicrophone();
    if (speechEngineRef.current) {
      speechEngineRef.current.toggleListening();
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    if (speechEngineRef.current) {
      speechEngineRef.current.setLanguage(lang);
    }
    addLog(`Switched language mode: ${lang}`, 'cyan');
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commandInput.trim();
    if (!text) return;
    setCommandInput('');
    setTranscript(text);
    addLog(`Manual input: "${text}"`, 'purple');
    executeCommand(text);
  };

  const handleQuickCard = (sampleText: string) => {
    setTranscript(sampleText);
    addLog(`Quick card triggered: "${sampleText}"`, 'purple');
    executeCommand(sampleText);
  };

  return (
    <>
      <div className="ambient-glow" />

      {/* Header */}
      <header>
        <div className="brand-wrapper">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>VoxPilot AI</h1>
            <span className="badge">Hybrid Voice Agent</span>
          </div>
        </div>

        <div className="header-status">
          <div className="status-pill" id="backend-status">
            <div className="pulse-dot" />
            <span>Hybrid Engine Active</span>
          </div>

          <div className="lang-selector">
            <button
              className={`lang-btn ${currentLang === 'en-IN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-IN')}
            >
              Hinglish
            </button>
            <button
              className={`lang-btn ${currentLang === 'hi-IN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('hi-IN')}
            >
              हिन्दी
            </button>
            <button
              className={`lang-btn ${currentLang === 'en-US' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-US')}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main>
        {/* Left / Center: Interactive Voice Stage */}
        <section className="glass-panel hero-stage">
          <h2 className="stage-title">Speak Any Command</h2>
          <p className="stage-subtitle">
            Try saying <span>"Open YouTube and play Chikni Chameli"</span> or <span>"Gmail pe email compose karo"</span>
          </p>

          {/* Quantum Voice Orb & Waveform Canvas */}
          <div
            className="orb-container"
            id="orb-container"
            title="Click to speak / toggle microphone"
            onClick={handleOrbClick}
          >
            <div className="orbit-ring orbit-ring-1" />
            <div className="orbit-ring orbit-ring-2" />
            <AudioVisualizer
              state={voiceState}
              onVisualizerReady={(handle) => {
                visualizerHandleRef.current = handle;
              }}
            />
            <div className={`quantum-orb ${voiceState !== 'idle' ? voiceState : ''}`} id="quantum-orb">
              <svg className="orb-mic-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
          </div>

          {/* Live Voice Transcript Card */}
          <div className="transcript-card">
            <div className="transcript-header">
              <span className="transcript-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Live Speech Transcript
              </span>
              {actionBadgeText && <span className="action-badge show">{actionBadgeText}</span>}
            </div>
            <p className={`transcript-text ${!transcript ? 'transcript-placeholder' : ''}`}>
              {transcript || 'Click the glowing orb to speak in Hindi, English, or Hinglish...'}
            </p>
          </div>

          {/* Command Input Bar */}
          <form className="command-input-bar" onSubmit={handleManualSubmit}>
            <div className="command-input-wrapper">
              <input
                type="text"
                className="command-input"
                placeholder="Or type command: 'bhai youtube pe song chalao'..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="send-btn">
              <span>Run</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </section>

        {/* Right: Quick Automation Triggers & Console */}
        <aside className="sidebar-section">
          {/* Capability Quick Cards */}
          <div className="glass-panel">
            <h3 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Quick Automation Triggers
            </h3>
            <div className="cards-grid">
              {/* YouTube Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('open youtube and play chikni chameli')}
              >
                <div className="card-left">
                  <div className="card-icon yt">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>Play "Chikni Chameli"</h4>
                    <p>YouTube Auto-Play</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* YouTube Hindi Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('youtube par arijit singh ke gaane sunao')}
              >
                <div className="card-left">
                  <div className="card-icon yt">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>Arijit Singh Songs</h4>
                    <p>"YouTube par gaane sunao"</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Gmail Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('open gmail and compose email to team')}
              >
                <div className="card-left">
                  <div className="card-icon gm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>Compose Gmail</h4>
                    <p>Opens pre-filled email draft</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* WhatsApp Web Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('open whatsapp web')}
              >
                <div className="card-left">
                  <div className="card-icon wa">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>WhatsApp Web</h4>
                    <p>"WhatsApp kholo"</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Desktop Calculator Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('calculator kholo')}
              >
                <div className="card-left">
                  <div className="card-icon sys">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>Open Calculator</h4>
                    <p>Native Windows App Launcher</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Desktop Notepad Card */}
              <div
                className="quick-card"
                onClick={() => handleQuickCard('notepad kholo')}
              >
                <div className="card-left">
                  <div className="card-icon sys">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <div className="card-details">
                    <h4>Open Notepad</h4>
                    <p>Text Editor & Notes</p>
                  </div>
                </div>
                <div className="card-run-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Terminal / Console Log */}
          <div className="glass-panel terminal-panel">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot dot-red" />
                <div className="terminal-dot dot-yellow" />
                <div className="terminal-dot dot-green" />
              </div>
              <span className="terminal-title">live-agent-console.log</span>
            </div>
            <div className="terminal-body" ref={terminalBodyRef} id="terminal-logs">
              {logs.map((log) => (
                <div key={log.id} className={`terminal-log-line ${log.type}`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer>
        <p>VoxPilot AI &bull; Autonomous Multilingual Voice Automation Agent &bull; Press Orb to Speak</p>
      </footer>

      {/* Simulator Modals */}
      {activeDesktopApp && (
        <DesktopSimulatorModal
          app={activeDesktopApp}
          onClose={() => setActiveDesktopApp(null)}
        />
      )}

      {activeYouTubeVideo && (
        <YouTubeModal
          videoId={activeYouTubeVideo.id}
          query={activeYouTubeVideo.query}
          onClose={() => setActiveYouTubeVideo(null)}
        />
      )}
    </>
  );
};
