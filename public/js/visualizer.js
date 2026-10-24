/**
 * VoxPilot AI - Audio Reactive Quantum Visualizer
 * Renders glowing audio waveforms and dynamic particle ripples around the central orb.
 */

class AudioVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.mediaStream = null;

    this.state = 'idle'; // 'idle' | 'listening' | 'processing' | 'speaking'
    this.animationId = null;
    this.phase = 0;

    this.initCanvasSize();
    window.addEventListener('resize', () => this.initCanvasSize());
    this.startLoop();
  }

  initCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 280) * dpr;
    this.canvas.height = (rect.height || 280) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 280;
    this.height = rect.height || 280;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  async attachMicrophoneStream(stream) {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.mediaStream = stream;
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (err) {
      console.warn('[Visualizer] Microphone Web Audio attach failed:', err);
    }
  }

  setState(state) {
    this.state = state;
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.phase += 0.035;

    const baseRadius = 88; // matches the quantum orb radius
    const numBars = 48;
    const step = (Math.PI * 2) / numBars;

    // Fetch frequency data if listening
    let frequencies = null;
    if (this.analyser && this.dataArray && this.state === 'listening') {
      this.analyser.getByteFrequencyData(this.dataArray);
      frequencies = this.dataArray;
    }

    for (let i = 0; i < numBars; i++) {
      const angle = i * step + this.phase * 0.15;
      let barHeight = 6;

      if (this.state === 'listening' && frequencies) {
        const freqIndex = Math.floor((i / numBars) * (frequencies.length / 2));
        const val = frequencies[freqIndex] || 0;
        barHeight = 4 + (val / 255) * 45;
      } else if (this.state === 'speaking') {
        barHeight = 8 + Math.sin(this.phase * 3 + i * 0.4) * 18;
      } else if (this.state === 'processing') {
        barHeight = 6 + Math.sin(this.phase * 2 + i * 0.8) * 12;
      } else {
        // Idle ambient shimmer
        barHeight = 4 + Math.sin(this.phase + i * 0.3) * 6;
      }

      const x1 = this.centerX + Math.cos(angle) * baseRadius;
      const y1 = this.centerY + Math.sin(angle) * baseRadius;
      const x2 = this.centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = this.centerY + Math.sin(angle) * (baseRadius + barHeight);

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);

      // Color gradation based on state
      let strokeColor = 'rgba(0, 242, 254, 0.4)';
      if (this.state === 'listening') {
        strokeColor = `rgba(0, 245, 160, ${0.4 + (barHeight / 50) * 0.6})`;
      } else if (this.state === 'processing') {
        strokeColor = `rgba(243, 85, 218, ${0.4 + (barHeight / 25) * 0.6})`;
      } else if (this.state === 'speaking') {
        strokeColor = `rgba(79, 172, 254, ${0.4 + (barHeight / 30) * 0.6})`;
      }

      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
  }
}

window.AudioVisualizer = AudioVisualizer;
