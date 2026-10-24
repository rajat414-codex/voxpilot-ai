import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../types';

interface AudioVisualizerProps {
  state: VoiceState;
  onVisualizerReady?: (visualizer: AudioVisualizerHandle) => void;
}

export interface AudioVisualizerHandle {
  attachMicrophoneStream: (stream: MediaStream) => Promise<void>;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, onVisualizerReady }) => {
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

    const initSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || 280;
      const h = rect.height || 280;
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
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        analyserRef.current = analyser;
      } catch (err) {
        console.warn('[Visualizer] Microphone Web Audio attach failed:', err);
      }
    };

    if (onVisualizerReady) {
      onVisualizerReady({ attachMicrophoneStream });
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 280;
      const height = rect.height || 280;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      phase += 0.035;

      const baseRadius = 88;
      const numBars = 48;
      const step = (Math.PI * 2) / numBars;
      const currentState = stateRef.current;

      let frequencies: Uint8Array | null = null;
      if (analyserRef.current && dataArrayRef.current && currentState === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        frequencies = dataArrayRef.current;
      }

      for (let i = 0; i < numBars; i++) {
        const angle = i * step + phase * 0.15;
        let barHeight = 6;

        if (currentState === 'listening' && frequencies) {
          const freqIndex = Math.floor((i / numBars) * (frequencies.length / 2));
          const val = frequencies[freqIndex] || 0;
          barHeight = 4 + (val / 255) * 45;
        } else if (currentState === 'speaking') {
          barHeight = 8 + Math.sin(phase * 3 + i * 0.4) * 18;
        } else if (currentState === 'processing') {
          barHeight = 6 + Math.sin(phase * 2 + i * 0.8) * 12;
        } else {
          barHeight = 4 + Math.sin(phase + i * 0.3) * 6;
        }

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        let strokeColor = 'rgba(0, 242, 254, 0.4)';
        if (currentState === 'listening') {
          strokeColor = `rgba(0, 245, 160, ${0.4 + (barHeight / 50) * 0.6})`;
        } else if (currentState === 'processing') {
          strokeColor = `rgba(243, 85, 218, ${0.4 + (barHeight / 25) * 0.6})`;
        } else if (currentState === 'speaking') {
          strokeColor = `rgba(79, 172, 254, ${0.4 + (barHeight / 30) * 0.6})`;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', initSize);
    };
  }, [onVisualizerReady]);

  return <canvas ref={canvasRef} className="visualizer-canvas" />;
};
