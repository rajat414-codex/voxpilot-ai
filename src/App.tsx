import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, VoiceState, IntentResult } from './types';
import { defaultIntentEngine } from './services/intentEngine';
import { defaultAutomationController } from './services/automation';
import { SpeechEngine } from './services/speechEngine';
import { AudioVisualizer, AudioVisualizerHandle } from './components/AudioVisualizer';

export const App: React.FC = () => {
  // State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en-IN');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isContinuous, setIsContinuous] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('');
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const visualizerHandleRef = useRef<AudioVisualizerHandle | null>(null);
  const micRequestedRef = useRef<boolean>(false);

  // Command Execution Handler (Opens REAL browser tabs and desktop applications)
  const executeCommand = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      setVoiceState('processing');

      // Intent classification (Multilingual NLP)
      const intent: IntentResult = defaultIntentEngine.parseIntent(clean);

      // Perform real action: opens real tabs/windows for YouTube, Gmail, Google, WhatsApp, Calculator
      const execResult = defaultAutomationController.execute(intent.action, intent.platform, intent.parameters);

      // Display clean status badge
      const displayMsg = execResult.message || `Executed: ${intent.action}`;
      setActionStatus(displayMsg);
      setTimeout(() => {
        setActionStatus(null);
      }, 5000);

      // Speak polite English-only voice confirmation, then immediately resume listening!
      if (speechEngineRef.current && intent.response_text) {
        speechEngineRef.current.speak(intent.response_text, () => {
          // Finished speaking -> resumes listening
        });
      } else {
        setVoiceState(isContinuous ? 'listening' : 'idle');
      }
    },
    [isContinuous]
  );

  // Initialize Speech Engine once
  useEffect(() => {
    const engine = new SpeechEngine(
      // 1. Live transcription stream
      (data) => {
        setTranscript(data.text);
      },
      // 2. Voice state
      (state) => {
        setVoiceState(state);
      },
      // 3. Command ready -> Executes action and stays listening!
      (commandText) => {
        executeCommand(commandText);
      }
    );

    speechEngineRef.current = engine;

    return () => {
      engine.stopListening();
    };
  }, [executeCommand]);

  // Request & attach mic to AI Bot visualizer
  const ensureMicrophone = async () => {
    if (micRequestedRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (visualizerHandleRef.current) {
        await visualizerHandleRef.current.attachMicrophoneStream(stream);
      }
      micRequestedRef.current = true;
    } catch (err: any) {
      console.warn('Microphone permission:', err);
    }
  };

  // Toggle Continuous Listening
  const handleToggleVoice = async () => {
    await ensureMicrophone();
    if (speechEngineRef.current) {
      const active = speechEngineRef.current.toggleListening();
      setIsContinuous(active);
    }
  };

  // Language change
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    if (speechEngineRef.current) {
      speechEngineRef.current.setLanguage(lang);
    }
  };

  // Submit typed command
  const handleInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commandInput.trim();
    if (!text) return;
    setCommandInput('');
    setTranscript(text);
    executeCommand(text);
  };

  const handleChipClick = (cmd: string) => {
    setTranscript(cmd);
    executeCommand(cmd);
  };

  return (
    <>
      {/* Minimal Header */}
      <header>
        <div className="brand-group">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <span className="brand-title">VoxPilot</span>
          <span className="brand-badge">AI Assistant</span>
        </div>

        <div className="header-actions">
          {/* Continuous Voice Toggle */}
          <div
            className={`mode-pill ${isContinuous && voiceState === 'listening' ? 'active' : ''}`}
            onClick={handleToggleVoice}
            title="Toggle Continuous Voice Mode"
          >
            <div className="pulse-dot" />
            <span>{voiceState === 'listening' ? 'Listening...' : 'Voice: Standby'}</span>
          </div>

          {/* Clean Language Selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`mode-pill ${currentLang === 'en-IN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-IN')}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Hinglish
            </button>
            <button
              className={`mode-pill ${currentLang === 'en-US' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en-US')}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Stage */}
      <main>
        <div className="hero-tagline">
          <h2>What would you like me to do?</h2>
          <p>
            Speak or type any command. I can open YouTube, search videos, compose Gmail, open WhatsApp, or launch desktop tools.
          </p>
        </div>

        {/* Animated AI Bot Companion */}
        <div className="bot-stage" onClick={handleToggleVoice} title="Click to speak or toggle listening">
          <AudioVisualizer
            state={voiceState}
            onVisualizerReady={(handle) => {
              visualizerHandleRef.current = handle;
            }}
            onClick={handleToggleVoice}
          />
          <div className="bot-caption">
            {voiceState === 'listening'
              ? 'Listening to you...'
              : voiceState === 'processing'
              ? 'Executing action...'
              : voiceState === 'speaking'
              ? 'Responding...'
              : 'Click to Activate'}
          </div>
        </div>

        {/* Floating Google / Perplexity Style Omnibar */}
        <div className="omnibar-wrapper">
          <form className="omnibar-card" onSubmit={handleInputSubmit}>
            {/* Audio Toggle Button inside input bar */}
            <button
              type="button"
              className={`mic-action-btn ${voiceState === 'listening' ? 'active' : ''}`}
              onClick={handleToggleVoice}
              title={voiceState === 'listening' ? 'Listening... click to pause' : 'Click to speak'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            {/* Main Command Input Field */}
            <input
              type="text"
              className="omnibar-input"
              placeholder="Ask anything or command... (e.g. 'open youtube and play arijit singh', 'open gmail')"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              autoFocus
            />

            {/* Send / Execute Button */}
            <button type="submit" className="send-action-btn" title="Run command">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          {/* Live Voice Stream & Status Feedback */}
          <div className="voice-stream-preview">
            {actionStatus && <span className="action-status-badge">⚡ {actionStatus}</span>}
            {transcript && !actionStatus && (
              <span className="transcript-active">"{transcript}"</span>
            )}
          </div>
        </div>

        {/* Natural Example Suggestion Chips */}
        <div className="suggestion-row">
          <div className="suggestion-chip" onClick={() => handleChipClick('open youtube')}>
            Open YouTube
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('play arijit singh on youtube')}>
            Play Songs on YouTube
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('open gmail')}>
            Open Gmail
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('open whatsapp web')}>
            WhatsApp Web
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('open calculator')}>
            Calculator
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('search weather on google')}>
            Google Search
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer>
        <p>VoxPilot AI &bull; Autonomous Command Execution &bull; Continuous Voice Listening Active</p>
      </footer>
    </>
  );
};
