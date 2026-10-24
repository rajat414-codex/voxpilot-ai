/**
 * VoxPilot AI - Multilingual Speech Recognition & Synthesis Engine
 * Handles speech-to-text in Hindi, Indian English, and mixed Hinglish,
 * with natural voice synthesis feedback.
 */

class SpeechEngine {
  constructor(onTranscriptCallback, onStateChangeCallback) {
    this.onTranscript = onTranscriptCallback || (() => {});
    this.onStateChange = onStateChangeCallback || (() => {});
    
    this.recognition = null;
    this.isListening = false;
    this.currentLanguage = 'en-IN'; // 'en-IN' handles Indian accents and Hinglish smoothly
    this.synth = window.speechSynthesis;
    this.preferredVoice = null;

    this.initRecognition();
    this.loadVoices();
  }

  initRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[Speech] Web Speech API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange('listening');
    };

    this.recognition.onresult = (event) => {
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

      this.onTranscript({
        text: (finalTranscript || interimTranscript).trim(),
        isFinal: Boolean(finalTranscript)
      });
    };

    this.recognition.onerror = (event) => {
      console.warn('[Speech] Recognition error:', event.error);
      this.isListening = false;
      this.onStateChange('idle');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange('idle');
    };
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  startListening() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Already running or permission issue
      console.log('[Speech] startListening exception:', e);
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.log('[Speech] stopListening exception:', e);
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  loadVoices() {
    const updateVoiceList = () => {
      if (!this.synth) return;
      const voices = this.synth.getVoices();
      // Try to select Hindi or Indian English voice
      this.preferredVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN')) ||
                            voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) ||
                            voices[0];
    };

    updateVoiceList();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoiceList;
    }
  }

  speak(text) {
    if (!this.synth || !text) return;

    // Cancel any ongoing speech
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
  }
}

window.SpeechEngine = SpeechEngine;
