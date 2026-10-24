import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../types';

interface AudioVisualizerProps {
  state: VoiceState;
  onVisualizerReady?: (visualizer: AudioVisualizerHandle) => void;
  onClick?: () => void;
}

export interface AudioVisualizerHandle {
  attachMicrophoneStream: (stream: MediaStream) => Promise<void>;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, onVisualizerReady, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const stateRef = useRef<VoiceState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    let blinkTimer = 0;
    let isBlinking = false;
    let audioLevel = 0;
    let targetAudioLevel = 0;

    const initSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width || 320;
      const h = rect.height || 300;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    initSize();
    window.addEventListener('resize', initSize);

    const attachMicrophoneStream = async (stream: MediaStream) => {
      try {
        if (!audioContextRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioCtx();
        }

        const audioCtx = audioContextRef.current;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.85;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        analyserRef.current = analyser;
      } catch (err) {
        console.warn('[AI Bot] Mic attach note:', err);
      }
    };

    if (onVisualizerReady) {
      onVisualizerReady({ attachMicrophoneStream });
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 320;
      const height = rect.height || 300;
      const cx = width / 2;
      const currentState = stateRef.current;

      phase += 0.035;

      // Random natural blinking timer
      blinkTimer += 1;
      if (blinkTimer > 160 && Math.random() < 0.04) {
        isBlinking = true;
      }
      if (blinkTimer > 175) {
        isBlinking = false;
        blinkTimer = 0;
      }

      // Audio calculation
      if (analyserRef.current && dataArrayRef.current && currentState === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        targetAudioLevel = sum / (dataArrayRef.current.length * 255);
      } else if (currentState === 'speaking') {
        targetAudioLevel = 0.35 + Math.sin(phase * 4) * 0.25;
      } else if (currentState === 'processing') {
        targetAudioLevel = 0.15;
      } else {
        targetAudioLevel = 0.04;
      }

      audioLevel += (targetAudioLevel - audioLevel) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Smooth floating hover physics
      const hoverY = Math.sin(phase * 1.5) * 8;
      const cy = height / 2 + hoverY;

      // 1. Soft Ambient Shadow below Bot
      const shadowGrad = ctx.createRadialGradient(cx, height - 35, 10, cx, height - 35, 90);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, height - 35, 80 + hoverY * 0.5, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Bot Outer Glowing Aura
      const auraGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 140);
      if (currentState === 'listening') {
        auraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.15)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (currentState === 'processing') {
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // 3. Bot Head Chassis (Modern Satin Obsidian & Slate metallic)
      const headWidth = 170;
      const headHeight = 135;
      const headRadius = 45;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - headWidth / 2, cy - headHeight / 2, headWidth, headHeight, headRadius);

      const chassisGrad = ctx.createLinearGradient(cx - headWidth / 2, cy - headHeight / 2, cx + headWidth / 2, cy + headHeight / 2);
      chassisGrad.addColorStop(0, '#1E293B'); // Slate Top
      chassisGrad.addColorStop(0.5, '#0F172A'); // Deep Slate
      chassisGrad.addColorStop(1, '#020617'); // Obsidian

      ctx.fillStyle = chassisGrad;
      ctx.fill();

      // Metallic Bevel Border
      ctx.strokeStyle = currentState === 'listening' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Bot Ears / Side Antenna Nodes
      const earWidth = 14;
      const earHeight = 36;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;

      // Left Ear
      ctx.beginPath();
      ctx.roundRect(cx - headWidth / 2 - earWidth + 3, cy - earHeight / 2, earWidth, earHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Right Ear
      ctx.beginPath();
      ctx.roundRect(cx + headWidth / 2 - 3, cy - earHeight / 2, earWidth, earHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Ear Accent Lights
      ctx.fillStyle = currentState === 'listening' ? '#34D399' : currentState === 'processing' ? '#C084FC' : '#818CF8';
      ctx.fillRect(cx - headWidth / 2 - earWidth + 6, cy - 6, 4, 12);
      ctx.fillRect(cx + headWidth / 2 + 4, cy - 6, 4, 12);

      // 5. High-Tech Glass Visor (Digital Face Screen)
      const visorWidth = 136;
      const visorHeight = 84;
      ctx.beginPath();
      ctx.roundRect(cx - visorWidth / 2, cy - visorHeight / 2 + 2, visorWidth, visorHeight, 26);
      ctx.fillStyle = '#05070D';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Visor Subtle Glass Specular Reflection
      const visorReflect = ctx.createLinearGradient(cx - visorWidth / 2, cy - visorHeight / 2, cx + visorWidth / 2, cy);
      visorReflect.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      visorReflect.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
      visorReflect.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = visorReflect;
      ctx.beginPath();
      ctx.roundRect(cx - visorWidth / 2, cy - visorHeight / 2 + 2, visorWidth, visorHeight, 26);
      ctx.fill();

      // 6. Expressive LED Eyes & Mouth
      const eyeColor = currentState === 'listening' ? '#34D399' : currentState === 'processing' ? '#C084FC' : '#60A5FA';
      const eyeSpacing = 30;
      const eyeY = cy - 4;

      if (currentState === 'processing') {
        // Scanning radar or circular digital eyes
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing, eyeY, 11, phase * 3, phase * 3 + Math.PI * 1.4);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx + eyeSpacing, eyeY, 11, -phase * 3, -phase * 3 + Math.PI * 1.4);
        ctx.stroke();
      } else {
        // Normal / Reactive Eyes
        const eyeHeight = isBlinking ? 2 : 16 + audioLevel * 8;
        const eyeWidth = 14;

        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 10;

        // Left Eye
        ctx.beginPath();
        ctx.roundRect(cx - eyeSpacing - eyeWidth / 2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight, 7);
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.roundRect(cx + eyeSpacing - eyeWidth / 2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight, 7);
        ctx.fill();

        ctx.shadowBlur = 0; // Reset blur
      }

      // 7. Visor Audio Wave Mouth / Frequency Spectrum (Reactive when speaking or listening)
      if (currentState === 'listening' || currentState === 'speaking') {
        const numBars = 12;
        const barSpacing = 5;
        const startX = cx - (numBars * barSpacing) / 2;
        const mouthY = cy + 26;

        ctx.fillStyle = eyeColor;
        for (let i = 0; i < numBars; i++) {
          const h = 3 + Math.sin(phase * 4 + i * 0.6) * (6 + audioLevel * 14);
          ctx.beginPath();
          ctx.roundRect(startX + i * barSpacing, mouthY - h / 2, 2.5, h, 1.5);
          ctx.fill();
        }
      } else {
        // Calm small friendly smile curve
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 22, 12, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', initSize);
    };
  }, [onVisualizerReady]);

  return <canvas ref={canvasRef} className="ai-bot-canvas" onClick={onClick} />;
};
