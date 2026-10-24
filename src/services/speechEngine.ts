import { SupportedLanguage, VoiceState } from '../types';

export interface SpeechTranscriptData {
  text: string;
  isFinal: boolean;
}

// Extend Window interface for Web Speech API types
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechEngine {
  private onTranscript: (data: SpeechTranscriptData) => void;
  private onStateChange: (state: VoiceState) => void;
  private recognition: any = null;
  public isListening = false;
  public currentLanguage: SupportedLanguage = 'en-IN';
  private synth: SpeechSynthesis | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  public isSupported = false;

  constructor(
    onTranscriptCallback: (data: SpeechTranscriptData) => void,
    onStateChangeCallback: (state: VoiceState) => void
  ) {
    this.onTranscript = onTranscriptCallback;
    this.onStateChange = onStateChangeCallback;

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
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
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

        const text = (finalTranscript || interimTranscript).trim();
        this.onTranscript({
          text,
          isFinal: Boolean(finalTranscript),
        });
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[Speech] Recognition error:', event.error);
        this.isListening = false;
        this.onStateChange('idle');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChange('idle');
      };
    } catch (e) {
      console.warn('[Speech] Initialization failed:', e);
    }
  }

  public setLanguage(langCode: SupportedLanguage): void {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return;

    try {
      this.recognition.start();
    } catch (e) {
      console.log('[Speech] startListening exception:', e);
    }
  }

  public stopListening(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.log('[Speech] stopListening exception:', e);
    }
  }

  public toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
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

  public speak(text: string): void {
    if (!this.synth || !text) return;

    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.onStateChange('speaking');
      };

      utterance.onend = () => {
        this.onStateChange('idle');
      };

      utterance.onerror = () => {
        this.onStateChange('idle');
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('[Speech] Synth error:', err);
      this.onStateChange('idle');
    }
  }
}
