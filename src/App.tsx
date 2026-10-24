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
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // In-Page Playable Media Players & AI Email Draft Dock
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; query: string; url: string | null } | null>(null);
  const [activeSpotify, setActiveSpotify] = useState<{ query: string; url: string | null; trackId?: string } | null>(null);
  const [activeEmail, setActiveEmail] = useState<{ to: string; from?: string; subject: string; body: string } | null>(null);

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const visualizerHandleRef = useRef<AudioVisualizerHandle | null>(null);
  const micRequestedRef = useRef<boolean>(false);

  // Command Execution Handler (Seamless playback & task execution)
  const executeCommand = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      setVoiceState('processing');

      // 1. Intent classification (Multilingual NLP)
      const intent: IntentResult = defaultIntentEngine.parseIntent(clean);

      // 2. Perform automation execution (awaits real-time video resolution for ANY title)
      const execResult = await defaultAutomationController.execute(intent.action, intent.platform, intent.parameters);

      // 3. If video or music playback, activate the in-page player!
      if (intent.action === 'play_youtube' || intent.action === 'open_youtube') {
        const vidId = execResult.videoId || 'GX9x62kFsVU';
        setActiveVideo({
          videoId: vidId,
          query: execResult.query || clean,
          url: execResult.url_opened,
        });
        setActiveSpotify(null);
      } else if (intent.action === 'open_spotify') {
        const trkId = defaultAutomationController.getSpotifyTrackId(execResult.query || '');
        setActiveSpotify({
          query: execResult.query || clean,
          url: execResult.url_opened,
          trackId: trkId || undefined,
        });
        // Also provide instant playable stream if videoId was resolved!
        if (execResult.videoId) {
          setActiveVideo({
            videoId: execResult.videoId,
            query: execResult.query || clean,
            url: `https://www.youtube.com/watch?v=${execResult.videoId}&autoplay=1`,
          });
        }
      }

      // If AI composed email, activate the email dock card!
      if (execResult.emailData) {
        setActiveEmail(execResult.emailData);
      }

      // 4. Status Badge Feedback
      const displayMsg = execResult.message || `Executed: ${intent.action}`;
      setActionStatus(displayMsg);
      setTimeout(() => {
        setActionStatus(null);
      }, 5000);

      // 5. Speak English confirmation, then immediately resume listening loop!
      if (speechEngineRef.current && intent.response_text) {
        speechEngineRef.current.speak(intent.response_text, () => {
          // Keep listening loop active
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
      (data) => {
        setTranscript(data.text);
      },
      (state) => {
        setVoiceState(state);
      },
      (commandText) => {
        executeCommand(commandText);
      }
    );

    speechEngineRef.current = engine;

    return () => {
      engine.stopListening();
    };
  }, [executeCommand]);

  // Request & attach microphone
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

  // Toggle AI Voice Audio Mute/Unmute
  const handleToggleAudioMute = () => {
    if (speechEngineRef.current) {
      const muted = speechEngineRef.current.toggleAudioMute();
      setIsAudioMuted(muted);
      if (!muted) {
        speechEngineRef.current.speak('Voice audio enabled.');
      }
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
      {/* Clean Minimalist Header */}
      <header>
        <div className="brand-group">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <span className="brand-title">VoxPilot</span>
          <span className="brand-badge">Voice Automation</span>
        </div>

        <div className="header-actions">
          {/* Audio Output Speech Toggle */}
          <div
            className={`mode-pill ${!isAudioMuted ? 'active' : ''}`}
            onClick={handleToggleAudioMute}
            title={isAudioMuted ? 'Click to Enable Audio Speech Reply' : 'Click to Mute Audio Speech Reply'}
            style={{ cursor: 'pointer' }}
          >
            <span>{!isAudioMuted ? '🔊 Audio: ON' : '🔇 Audio: MUTE'}</span>
          </div>

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
            Speak or type commands. I can play videos on YouTube, search Spotify, compose Gmail, open WhatsApp, or launch desktop tools.
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

        {/* In-Page AI Composed Email Dock Card */}
        {activeEmail && (
          <div className="email-dock-card">
            <div className="email-dock-top">
              <div className="email-dock-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span>AI Composed Email (Ready to Send)</span>
              </div>
              <div className="email-dock-actions">
                <button
                  className="media-tab-btn"
                  onClick={() => {
                    const url = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodeURIComponent(activeEmail.to)}&su=${encodeURIComponent(activeEmail.subject)}&body=${encodeURIComponent(activeEmail.body)}`;
                    defaultAutomationController.openExternalTab(url);
                  }}
                  title="Open directly in Gmail Compose"
                >
                  🚀 Open in Gmail Compose ↗
                </button>
                <button
                  className="media-tab-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`To: ${activeEmail.to}\nSubject: ${activeEmail.subject}\n\n${activeEmail.body}`);
                    setActionStatus('Email draft copied to clipboard!');
                    setTimeout(() => setActionStatus(null), 3000);
                  }}
                  title="Copy full email text"
                >
                  📋 Copy
                </button>
                <button
                  className="media-close-btn"
                  onClick={() => setActiveEmail(null)}
                  title="Close email draft"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="email-meta-grid">
              <div className="email-meta-row">
                <span className="email-meta-label">To:</span>
                <span className="email-meta-val">{activeEmail.to}</span>
              </div>
              {activeEmail.from && (
                <div className="email-meta-row">
                  <span className="email-meta-label">From:</span>
                  <span className="email-meta-val">{activeEmail.from}</span>
                </div>
              )}
              <div className="email-meta-row">
                <span className="email-meta-label">Subject:</span>
                <span className="email-meta-val subject-bold">{activeEmail.subject}</span>
              </div>
            </div>

            <div className="email-body-preview">
              <pre>{activeEmail.body}</pre>
            </div>
          </div>
        )}

        {/* In-Page Playable YouTube Video Player Dock */}
        {activeVideo && (
          <div className="media-player-dock">
            <div className="media-dock-header">
              <div className="media-dock-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff334b">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
                <span>Now Playing: {activeVideo.query}</span>
              </div>
              <div className="media-dock-controls">
                {activeVideo.url && (
                  <button
                    className="media-tab-btn"
                    onClick={() => defaultAutomationController.openExternalTab(activeVideo.url!)}
                    title="Open on YouTube website"
                  >
                    Open Tab ↗
                  </button>
                )}
                <button
                  className="media-close-btn"
                  onClick={() => setActiveVideo(null)}
                  title="Close player"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="video-dock-frame">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&enablejsapi=1`}
                title="YouTube Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* In-Page Spotify Media Player Dock */}
        {activeSpotify && (
          <div className="spotify-dock-card">
            <div className="spotify-dock-top">
              <div className="spotify-left">
                <div className="spotify-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#1ed760">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.348-1.435-5.304-1.76-8.785-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.714 1.115.294.18.386.562.207.855zm1.225-2.724c-.226.367-.707.482-1.074.256-2.687-1.652-6.785-2.131-9.965-1.166-.413.126-.849-.107-.975-.52-.126-.414.107-.849.52-.975 3.632-1.103 8.147-.568 11.238 1.33.367.226.482.708.256 1.075zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.018-.128-1.168-.622-.15-.494.128-1.018.622-1.168 3.532-1.072 9.404-.866 13.115 1.338.444.263.59.838.327 1.282-.264.444-.838.59-1.282.327z" />
                  </svg>
                </div>
                <div className="spotify-meta">
                  <h4>Spotify: {activeSpotify.query}</h4>
                  <p>Click Play to listen</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {activeSpotify.url && (
                  <button
                    className="media-tab-btn"
                    onClick={() => defaultAutomationController.openExternalTab(activeSpotify.url!)}
                  >
                    Open Spotify App ↗
                  </button>
                )}
                <button
                  className="media-close-btn"
                  onClick={() => setActiveSpotify(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Real Playable Spotify Embed Widget if trackId known */}
            {activeSpotify.trackId && (
              <div className="spotify-frame-wrapper">
                <iframe
                  src={`https://open.spotify.com/embed/track/${activeSpotify.trackId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify Track Player"
                />
              </div>
            )}
          </div>
        )}

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
              placeholder="Ask or command anything... (e.g. 'application leave likh to manager@company.com', 'tauba tauba play kro')"
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
          <div
            className="suggestion-chip"
            onClick={() =>
              handleChipClick(
                'application leave likh to the email of manager@company.com by my mail student@college.edu'
              )
            }
          >
            ✉️ Leave Application Email
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('tauba tauba play kro')}>
            ▶ Tauba Tauba Play Kro
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('gehra hua sunao')}>
            🎵 Gehra Hua Sunao
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('kuch bhi play krde')}>
            🎲 Kuch Bhi Play Krde
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('video title carryminati roast')}>
            🎬 Video Title CarryMinati
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('open whatsapp web')}>
            WhatsApp Web
          </div>
          <div className="suggestion-chip" onClick={() => handleChipClick('open calculator')}>
            Calculator
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer>
        <p>VoxPilot AI &bull; Autonomous Media Playback & Command Execution &bull; Continuous Voice Listening</p>
      </footer>
    </>
  );
};
