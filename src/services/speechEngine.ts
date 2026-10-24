import { SupportedLanguage, VoiceState } from '../types';

export interface SpeechTranscriptData {
  text: string;
  isFinal: boolean;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechEngine {
  private onTranscript: (data: SpeechTranscriptData) => void;
  private onStateChange: (state: VoiceState) => void;
  private onCommandReady?: (commandText: string) => void;

  private recognition: any = null;
  public isListening = false;
  public shouldKeepListening = false;
  public isSpeaking = false;
  public isAudioMuted = false;
  public currentLanguage: SupportedLanguage = 'en-IN';
  private synth: SpeechSynthesis | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  public isSupported = false;

  private restartTimeout: any = null;
  private lastExecutedText = '';
  private lastExecutedTime = 0;

  constructor(
    onTranscriptCallback: (data: SpeechTranscriptData) => void,
    onStateChangeCallback: (state: VoiceState) => void,
    onCommandReadyCallback?: (commandText: string) => void
  ) {
    this.onTranscript = onTranscriptCallback;
    this.onStateChange = onStateChangeCallback;
    this.onCommandReady = onCommandReadyCallback;

    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
      this.initRecognition();
      this.loadVoices();
    }
  }

  private initRecognition(): void {
    const iWin = window as unknown as IWindow;
    const SpeechRec = iWin.SpeechRecognition || iWin.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('[Speech] Web Speech API not supported in this browser.');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true; // Continuous listening: never stops!
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        // Prevent microphone picking up the AI's own synthesized voice
        if (this.isSpeaking) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (activeText) {
          this.onTranscript({
            text: activeText,
            isFinal: Boolean(finalTranscript),
          });
        }

        // When a distinct final command is recognized, trigger callback
        if (finalTranscript && finalTranscript.trim().length > 1) {
          const now = Date.now();
          const clean = finalTranscript.trim().toLowerCase();

          // Debounce repeated triggers within 2.5 seconds
          if (clean !== this.lastExecutedText || now - this.lastExecutedTime > 2500) {
            this.lastExecutedText = clean;
            this.lastExecutedTime = now;
            if (this.onCommandReady) {
              this.onCommandReady(finalTranscript.trim());
            }
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore silent expected errors like 'no-speech'
        if (event.error !== 'no-speech') {
          console.warn('[Speech] Recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart loop if user hasn't explicitly stopped continuous mode
        if (this.shouldKeepListening && !this.isSpeaking) {
          this.scheduleRestart(250);
        } else if (!this.shouldKeepListening) {
          this.onStateChange('idle');
        }
      };
    } catch (e) {
      console.warn('[Speech] Initialization failed:', e);
    }
  }

  private scheduleRestart(delay = 250): void {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.shouldKeepListening && !this.isListening && !this.isSpeaking) {
        try {
          this.recognition?.start();
        } catch {
          // In case already started
        }
      }
    }, delay);
  }

  public setLanguage(langCode: SupportedLanguage): void {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
      if (this.isListening) {
        this.stopListening();
        setTimeout(() => this.startListening(), 350);
      }
    }
  }

  public startListening(): void {
    this.shouldKeepListening = true;
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return;

    try {
      this.recognition.start();
    } catch {
      // Already running
    }
  }

  public stopListening(): void {
    this.shouldKeepListening = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch {
      // Ignore
    }
    this.isListening = false;
    this.onStateChange('idle');
  }

  public toggleListening(): boolean {
    if (this.shouldKeepListening) {
      this.stopListening();
      return false;
    } else {
      this.startListening();
      return true;
    }
  }

  public loadVoices(): void {
    if (!this.synth) return;

    const updateVoiceList = () => {
      if (!this.synth) return;
      const voices = this.synth.getVoices();
      this.preferredVoice =
        voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN')) ||
        voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en-US')) ||
        voices[0] ||
        null;
    };

    updateVoiceList();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoiceList;
    }
  }

  public toggleAudioMute(): boolean {
    this.isAudioMuted = !this.isAudioMuted;
    if (this.isAudioMuted && this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
    return this.isAudioMuted;
  }

  public speak(text: string, onEnd?: () => void): void {
    if (this.isAudioMuted || !this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeaking = true;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.onStateChange('speaking');
    };

    const finishSpeaking = () => {
      this.isSpeaking = false;
      if (this.shouldKeepListening) {
        this.onStateChange('listening');
        this.scheduleRestart(300);
      } else {
        this.onStateChange('idle');
      }
      if (onEnd) onEnd();
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    this.synth.speak(utterance);
  }
}
