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
    let audioLevel = 0;
    let targetAudioLevel = 0;

    const initSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width || 260;
      const h = rect.height || 260;
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
        console.warn('[Visualizer] Microphone Web Audio attach failed:', err);
      }
    };

    if (onVisualizerReady) {
      onVisualizerReady({ attachMicrophoneStream });
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 260;
      const height = rect.height || 260;
      const cx = width / 2;
      const cy = height / 2;

      phase += 0.025;
      const currentState = stateRef.current;

      // Audio reactivity calculations
      if (analyserRef.current && dataArrayRef.current && currentState === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        targetAudioLevel = sum / (dataArrayRef.current.length * 255);
      } else if (currentState === 'speaking') {
        targetAudioLevel = 0.35 + Math.sin(phase * 4) * 0.2;
      } else if (currentState === 'processing') {
        targetAudioLevel = 0.15;
      } else {
        targetAudioLevel = 0.03;
      }

      audioLevel += (targetAudioLevel - audioLevel) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const baseRadius = 78 + audioLevel * 18;
      const numPoints = 64;
      const angleStep = (Math.PI * 2) / numPoints;

      // 1. Soft Outer Ambient Shadow / Aura
      const auraGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, baseRadius * 1.55);
      if (currentState === 'listening') {
        auraGrad.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
        auraGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        auraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (currentState === 'processing') {
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
        auraGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.06)');
        auraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(99, 102, 241, 0.09)');
        auraGrad.addColorStop(0.7, 'rgba(30, 41, 59, 0.03)');
        auraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      }

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. Generate Organic Deformed Sphere Points
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep;
        const wave1 = Math.sin(angle * 3 + phase * 2) * (3 + audioLevel * 12);
        const wave2 = Math.cos(angle * 5 - phase * 1.5) * (2 + audioLevel * 8);
        const wave3 = Math.sin(angle * 2 + phase) * 3;

        const r = baseRadius + wave1 + wave2 + wave3;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        points.push({ x, y });
      }

      // 3. Draw Organic Fluid Blob Body
      ctx.beginPath();
      ctx.moveTo((points[0].x + points[numPoints - 1].x) / 2, (points[0].y + points[numPoints - 1].y) / 2);
      for (let i = 0; i < numPoints; i++) {
        const nextIdx = (i + 1) % numPoints;
        const midX = (points[i].x + points[nextIdx].x) / 2;
        const midY = (points[i].y + points[nextIdx].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.closePath();

      // Executive Pearlescent Satin Gradient
      const bodyGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.35,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius * 1.15
      );

      if (currentState === 'listening') {
        bodyGrad.addColorStop(0, '#E0E7FF'); // Satin Pearl
        bodyGrad.addColorStop(0.25, '#818CF8'); // Indigo
        bodyGrad.addColorStop(0.65, '#4F46E5'); // Royal Indigo
        bodyGrad.addColorStop(0.95, '#1E1B4B'); // Twilight
        bodyGrad.addColorStop(1, '#0F172A');
      } else if (currentState === 'processing') {
        bodyGrad.addColorStop(0, '#F3E8FF');
        bodyGrad.addColorStop(0.3, '#C084FC');
        bodyGrad.addColorStop(0.7, '#7E22CE');
        bodyGrad.addColorStop(1, '#1E1B4B');
      } else {
        bodyGrad.addColorStop(0, '#F1F5F9'); // Satin White
        bodyGrad.addColorStop(0.3, '#94A3B8'); // Slate
        bodyGrad.addColorStop(0.65, '#334155'); // Deep Slate
        bodyGrad.addColorStop(0.95, '#0F172A'); // Obsidian
        bodyGrad.addColorStop(1, '#090D1A');
      }

      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // 4. Subtle Refraction Specular Rim
      ctx.strokeStyle = currentState === 'listening' ? 'rgba(165, 180, 252, 0.45)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 5. Specular Reflection Highlight
      const specGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.42,
        2,
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.42,
        baseRadius * 0.45
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      specGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.ellipse(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.42,
        baseRadius * 0.32,
        baseRadius * 0.2,
        -Math.PI / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 6. Subtle inner orbiting particle ring during processing
      if (currentState === 'processing') {
        const ringRadius = baseRadius * 1.18;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, phase * 3, phase * 3 + Math.PI * 1.3);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', initSize);
    };
  }, [onVisualizerReady]);

  return <canvas ref={canvasRef} className="bubble-canvas" />;
};
