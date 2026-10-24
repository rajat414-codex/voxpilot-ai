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
  const [isContinuous, setIsContinuous] = useState<boolean>(true);
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
      message: 'VoxPilot AI Platform Initialized.',
      type: 'info',
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Continuous voice pipeline active. Listens command after command without stopping.',
      type: 'success',
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

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Command Execution Handler (Seamless, maintains continuous listening loop)
  const executeCommand = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      setVoiceState('processing');
      addLog(`Analyzing Intent: "${clean}"...`, 'info');

      // Intent classification using multilingual parser
      const intent: IntentResult = defaultIntentEngine.parseIntent(clean);
      addLog(`Intent: ${intent.action} (${intent.platform})`, 'success');

      // Execute automation
      const execResult = defaultAutomationController.execute(intent.action, intent.platform, intent.parameters);

      if (execResult.message) {
        addLog(`Automation: ${execResult.message}`, 'action');
      }

      // Display action badge
      const badgeTitle = `Executed: ${String(intent.action).toUpperCase()}`;
      setActionBadgeText(badgeTitle);
      setTimeout(() => {
        setActionBadgeText(null);
      }, 4500);

      // Handle modals / in-app simulators
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

      // Voice confirmation feedback -> Then seamlessly stay listening for next command!
      if (speechEngineRef.current && intent.response_text) {
        speechEngineRef.current.speak(intent.response_text, () => {
          addLog('Listening for next command...', 'info');
        });
      } else {
        setVoiceState(isContinuous ? 'listening' : 'idle');
      }
    },
    [addLog, isContinuous]
  );

  // Initialize Speech Engine once
  useEffect(() => {
    const engine = new SpeechEngine(
      // 1. On transcript update
      (data) => {
        setTranscript(data.text);
      },
      // 2. On voice state change
      (state) => {
        setVoiceState(state);
      },
      // 3. On distinct command ready -> Executes and keeps listening!
      (commandText) => {
        addLog(`Voice Prompt: "${commandText}"`, 'action');
        executeCommand(commandText);
      }
    );

    speechEngineRef.current = engine;

    return () => {
      engine.stopListening();
    };
  }, [executeCommand, addLog]);

  // Request Microphone Stream once for organic visualizer
  const ensureMicrophoneAccess = async () => {
    if (micRequestedRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (visualizerHandleRef.current) {
        await visualizerHandleRef.current.attachMicrophoneStream(stream);
      }
      micRequestedRef.current = true;
      addLog('Microphone connected to neural organic bubble visualizer.', 'success');
    } catch (err: any) {
      addLog(`Microphone access note: ${err?.message || 'Permission denied'}`, 'warn');
    }
  };

  // Toggle Continuous Listening
  const handleToggleVoice = async () => {
    await ensureMicrophoneAccess();
    if (speechEngineRef.current) {
      const active = speechEngineRef.current.toggleListening();
      setIsContinuous(active);
      if (active) {
        addLog('Continuous Listening Activated: Say command after command.', 'success');
      } else {
        addLog('Voice listening paused.', 'warn');
      }
    }
  };

  // Language switch
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    if (speechEngineRef.current) {
      speechEngineRef.current.setLanguage(lang);
      addLog(`Language model switched to: ${lang}`, 'info');
    }
  };

  // Manual command submit
  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commandInput.trim();
    if (!text) return;
    setCommandInput('');
    setTranscript(text);
    addLog(`Manual input: "${text}"`, 'action');
    executeCommand(text);
  };

  const handleQuickCard = (cmd: string) => {
    setTranscript(cmd);
    addLog(`Integration preset: "${cmd}"`, 'action');
    executeCommand(cmd);
  };

  return (
    <>
      <div className="bg-grid" />

      {/* Modern SaaS Navigation Header */}
      <header>
        <div className="brand">
          <div className="brand-symbol">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div className="brand-info">
            <h1>VoxPilot</h1>
            <span>Autonomous Voice Automation</span>
          </div>
        </div>

        <div className="header-controls">
          {/* Continuous Listening Toggle Button */}
          <div
            className={`continuous-badge ${!isContinuous ? 'paused' : ''}`}
            onClick={handleToggleVoice}
            title="Click to toggle continuous listening"
          >
            <div className="dot-indicator" />
            <span>{isContinuous ? 'Continuous: Active' : 'Continuous: Paused'}</span>
          </div>

          {/* Language Selector */}
          <div className="lang-switch">
            <button
              className={`lang-pill ${currentLang === 'en-IN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-IN')}
            >
              Hinglish
            </button>
            <button
              className={`lang-pill ${currentLang === 'hi-IN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('hi-IN')}
            >
              हिन्दी
            </button>
            <button
              className={`lang-pill ${currentLang === 'en-US' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-US')}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main SaaS Dashboard Layout */}
      <main>
        {/* Left Stage: Organic Fluid AI Entity & Continuous Stream */}
        <section className="saas-card ai-stage">
          <div className="stage-header">
            <h2>Persistent Voice Automation</h2>
            <p>
              Speak naturally in <strong>Hindi, English, or Hinglish</strong>. It keeps listening <strong>command after command</strong> without stopping.
            </p>
          </div>

          {/* Central Pearlescent Fluid AI Bubble */}
          <div
            className="bubble-container"
            onClick={handleToggleVoice}
            title="Click to toggle continuous voice recognition"
          >
            <AudioVisualizer
              state={voiceState}
              onVisualizerReady={(handle) => {
                visualizerHandleRef.current = handle;
              }}
            />
            <div className="bubble-overlay">
              <svg className="bubble-status-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              <span className="bubble-status-text">
                {voiceState === 'listening'
                  ? 'Listening (Speak Next)...'
                  : voiceState === 'processing'
                  ? 'Processing Intent...'
                  : voiceState === 'speaking'
                  ? 'Executing Task...'
                  : 'Click Bubble to Activate'}
              </span>
            </div>
          </div>

          {/* Live Voice Stream Box */}
          <div className="stream-box">
            <div className="stream-meta">
              <span className="stream-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Speech Input Stream
              </span>
              {actionBadgeText && <span className="action-pill">{actionBadgeText}</span>}
            </div>
            <p className={`stream-content ${!transcript ? 'placeholder' : ''}`}>
              {transcript || 'Click the bubble to activate voice, then say: "Open YouTube and play Chikni Chameli"...'}
            </p>
          </div>

          {/* Prompt Input Form */}
          <form className="prompt-form" onSubmit={handleManualSubmit}>
            <input
              type="text"
              className="prompt-field"
              placeholder="Or type prompt: 'bhai youtube pe arijit singh ke gaane chalao'..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <span>Execute</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </section>

        {/* Right Sidebar: Platform Presets & Developer Console */}
        <aside className="side-stack">
          {/* Quick Platform Presets */}
          <div className="saas-card" style={{ padding: '1.25rem 1.4rem' }}>
            <div className="card-title">
              <span>Platform Integrations</span>
              <span className="counter">Ready to Trigger</span>
            </div>

            <div className="action-list">
              {/* YouTube Card 1 */}
              <div
                className="action-item"
                onClick={() => handleQuickCard('open youtube and play chikni chameli')}
              >
                <div className="action-left">
                  <div className="action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <div className="action-meta">
                    <h4>Play "Chikni Chameli"</h4>
                    <p>YouTube Auto-Play Direct</p>
                  </div>
                </div>
                <div className="action-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* YouTube Card 2 */}
              <div
                className="action-item"
                onClick={() => handleQuickCard('youtube par arijit singh ke gaane sunao')}
              >
                <div className="action-left">
                  <div className="action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                  <div className="action-meta">
                    <h4>Arijit Singh Hits</h4>
                    <p>"YouTube par gaane sunao"</p>
                  </div>
                </div>
                <div className="action-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Gmail Card */}
              <div
                className="action-item"
                onClick={() => handleQuickCard('open gmail and compose email to rohit')}
              >
                <div className="action-left">
                  <div className="action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div className="action-meta">
                    <h4>Compose Gmail Draft</h4>
                    <p>"Gmail kholo aur email draft karo"</p>
                  </div>
                </div>
                <div className="action-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* WhatsApp Web Card */}
              <div
                className="action-item"
                onClick={() => handleQuickCard('open whatsapp web')}
              >
                <div className="action-left">
                  <div className="action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                    </svg>
                  </div>
                  <div className="action-meta">
                    <h4>WhatsApp Web</h4>
                    <p>"WhatsApp kholo"</p>
                  </div>
                </div>
                <div className="action-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              {/* Desktop Calculator Card */}
              <div
                className="action-item"
                onClick={() => handleQuickCard('calculator kholo')}
              >
                <div className="action-left">
                  <div className="action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                  </div>
                  <div className="action-meta">
                    <h4>Launch Calculator</h4>
                    <p>Native Desktop Application</p>
                  </div>
                </div>
                <div className="action-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Execution Terminal */}
          <div className="saas-card terminal-card">
            <div className="terminal-header">
              <div className="terminal-tabs">
                <div className="terminal-dot" />
                <div className="terminal-dot" />
                <div className="terminal-dot" />
              </div>
              <span className="terminal-name">execution.log</span>
            </div>
            <div className="terminal-feed" ref={terminalBodyRef} id="terminal-logs">
              {logs.map((log) => (
                <div key={log.id} className={`terminal-row ${log.type}`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer>
        <p>VoxPilot &bull; Enterprise Continuous Voice Automation Platform &bull; Listens Command After Command</p>
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
