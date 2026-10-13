'use client';

import { useEffect, useState } from "react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({
  onComplete,
}: IntroAnimationProps) {
  const [curtainLift, setCurtainLift] = useState<boolean>(false);
  const [fadeScene, setFadeScene] = useState<boolean>(false);

  useEffect(() => {
    /**
     * SINTETIZADOR DE VOZ ESPACIAL (Convertiá)
     */
    const playDeepSpaceVoice = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      let audioCtx: AudioContext | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const oscGain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(50, audioCtx.currentTime);
          oscGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
          oscGain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 1.2);
          oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 4.5);
          
          osc.connect(oscGain);
          oscGain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 4.6);
        }
      } catch (e) {
        console.error('Audio Context Error:', e);
      }

      const utterance = new SpeechSynthesisUtterance('Bienvenidos... a Convertiá.');
      utterance.lang = 'es-ES';
      utterance.rate = 0.78;
      utterance.pitch = 0.68;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural') || v.name.includes('Pablo'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 450);
    };

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    // Disparar secuencia automática al cargar
    playDeepSpaceVoice();

    const curtainTimer = setTimeout(() => {
      setCurtainLift(true);
    }, 400);

    const fadeTimer = setTimeout(() => {
      setFadeScene(true);
    }, 4200);

    const completionTimer = window.setTimeout(() => {
      onComplete();
    }, 5400);

    return () => {
      clearTimeout(curtainTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completionTimer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onComplete]);

  return (
    <>
      {/* Estilos globales limpios */}
      <style jsx global>{`
        :root {
          color-scheme: dark;
          --bg-deep: #040609;
          --brand-color: #15cb90;
          --color-dark: #064D56;
          --convert-color: rgba(255, 255, 255, 0.6);
          --muted: #94a3b8;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--bg-deep);
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
      `}</style>

      {/* Estilos encapsulados de la animación y atmósfera */}
      <style jsx>{`
        .scene {
          position: relative;
          isolation: isolate;
          width: 100vw;
          height: 100svh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 50% 40%, rgba(21, 203, 144, 0.12), transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(11, 13, 23, 0.8), transparent 50%),
            linear-gradient(135deg, #040609 0%, #0b0d17 50%, #030406 100%);
          transition: opacity 1200ms cubic-bezier(.4, 0, .2, 1);
        }

        .scene.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .cinematic-curtain {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: radial-gradient(circle at center, transparent 25%, rgba(2, 4, 7, 0.98) 90%);
          pointer-events: none;
          opacity: 1;
          transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cinematic-curtain.lift {
          opacity: 0;
        }

        .grain {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.08;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
        }

        .ambient {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .ambient::before, .ambient::after {
          content: "";
          position: absolute;
          width: 70vw;
          height: 70vw;
          max-width: 800px;
          max-height: 800px;
          border: 1px solid rgba(21, 203, 144, 0.05);
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 100px rgba(21, 203, 144, 0.03);
        }

        .ambient::after {
          width: 50vw;
          height: 50vw;
          max-width: 580px;
          max-height: 580px;
          border-color: rgba(21, 203, 144, 0.08);
        }

        .beam {
          position: absolute;
          width: 80vw;
          height: 1px;
          left: -95vw;
          top: 35%;
          background: linear-gradient(90deg, transparent, rgba(21, 203, 144, .6), transparent);
          filter: drop-shadow(0 0 10px rgba(21, 203, 144, .4));
          transform: rotate(-15deg);
          animation: beamSweep 3.2s .2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .beam.two {
          top: 65%;
          animation-delay: .8s;
          opacity: .5;
          transform: rotate(12deg);
        }

        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          bottom: -15px;
          width: var(--size, 3px);
          height: var(--size, 3px);
          border-radius: 50%;
          background: var(--brand-color);
          opacity: 0;
          box-shadow: 0 0 12px rgba(21, 203, 144, 0.7);
          animation: rise var(--dur, 7s) var(--delay, 0s) linear infinite;
        }

        .intro {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2.5rem;
          background: transparent;
          opacity: 1;
          pointer-events: none;
        }

        .logo-container {
          width: 140px;
          height: 140px;
          cursor: pointer;
        }

        .logo-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 0 12px rgba(21, 203, 144, 0.2)); 
        }

        .geom {
          fill: none;
          stroke-width: 12px;
          transform-origin: center;
          stroke-linecap: butt;
        }

        .center-dot {
          fill: var(--color-dark);
          animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .ring-middle {
          stroke: var(--brand-color);
          stroke-dasharray: 88.88 100;
          transform: rotate(200deg);
          animation: draw-ring 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
          stroke-dashoffset: 100;
        }

        .ring-outer-dark {
          stroke: var(--color-dark);
          stroke-dasharray: 66.66 100;
          transform: rotate(60deg);
          animation: draw-ring 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
          stroke-dashoffset: 100;
        }

        .ring-outer-light {
          stroke: var(--brand-color);
          stroke-dasharray: 22.22 100;
          transform: rotate(320deg);
          animation: draw-ring 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards;
          stroke-dashoffset: 100;
        }

        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes draw-ring {
          to { stroke-dashoffset: 0; }
        }

        .logo-spin-wrapper {
          transform-origin: center;
          animation: slow-spin 8s linear infinite;
          animation-play-state: paused;
        }

        .logo-container:hover .logo-spin-wrapper {
          animation-play-state: running;
        }

        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animated-text-container {
          width: 420px;
          height: 60px;
          display: flex;
          justify-content: center;
        }

        .text-loader-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 0 10px rgba(21, 203, 144, 0.25));
        }

        .base-typography {
          font-family: 'Arial Black', Impact, system-ui, sans-serif;
          font-size: 36px;
          font-weight: 900;
          letter-spacing: 2px;
          stroke-width: 3px;
          stroke-linecap: round;
          stroke-linejoin: round;
          
          animation: 
            textDashArray 5.5s ease-in-out 1.2s infinite,
            textDashOffset 5.5s linear 1.2s infinite,
            fadeInFill 5.5s ease-in-out 1.2s infinite;
          
          stroke-dasharray: 0 1 400 0;
          stroke-dashoffset: 405;
          fill-opacity: 0;
        }

        .text-brand {
          fill: var(--brand-color);
          stroke: var(--brand-color);
        }

        .text-convert-filled {
          fill: var(--convert-color);
          stroke: var(--convert-color);
        }

        @keyframes textDashArray {
          0% { stroke-dasharray: 0 1 400 0; }
          50% { stroke-dasharray: 0 400 1 0; }
          100% { stroke-dasharray: 400 1 0 0; }
        }

        @keyframes textDashOffset {
          0% { stroke-dashoffset: 405; }
          100% { stroke-dashoffset: 5; }
        }

        @keyframes fadeInFill {
          0%, 20% { fill-opacity: 0; }
          40%, 80% { fill-opacity: 1; }
          100% { fill-opacity: 0; }
        }

        @keyframes beamSweep {
          0% { left: -95vw; opacity: 0; }
          15% { opacity: 0.95; }
          100% { left: 130vw; opacity: 0; }
        }

        @keyframes rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          15% { opacity: var(--alpha, 0.45); }
          85% { opacity: 0.2; }
          100% { transform: translate3d(var(--drift, 18px), -105svh, 0); opacity: 0; }
        }

        @media (max-width: 520px) {
          .logo-container { width: 110px; height: 110px; }
          .animated-text-container { width: 100%; height: 50px; }
          .base-typography { font-size: 26px; }
        }
      `}</style>

      <main className={`scene ${fadeScene ? 'fade-out' : ''}`}>
        {/* Telón Cinemático de Apertura */}
        <div className={`cinematic-curtain ${curtainLift ? 'lift' : ''}`} />

        {/* Atmósfera Espacial de Fondo */}
        <div className="ambient" aria-hidden="true">
          <div className="beam" />
          <div className="beam two" />
          <div className="particles">
            {Array.from({ length: 26 }).map((_, i) => (
              <i
                key={i}
                className="particle"
                style={{
                  left: `${(i * 41 + 5) % 100}%`,
                  ['--size' as string]: `${i % 5 === 0 ? 3 : 2}px`,
                  ['--dur' as string]: `${6 + (i % 6) * 1.3}s`,
                  ['--delay' as string]: `-${(i % 9) * 0.7}s`,
                  ['--drift' as string]: `${(i % 2 ? 1 : -1) * (8 + (i % 4) * 8)}px`,
                  ['--alpha' as string]: `${0.25 + (i % 5) * 0.09}`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="grain" aria-hidden="true" />

        {/* Secuencia de Introducción Vectorial Original */}
        <section className="intro" aria-label="Animación de bienvenida">
          <div className="logo-container" title="">
            <svg viewBox="0 0 120 120" className="logo-svg" aria-label="Logo Tecnológico">
              <g className="logo-spin-wrapper">
                <circle cx="60" cy="60" r="16" className="center-dot" />
                <circle cx="60" cy="60" r="30" className="geom ring-middle" pathLength="100" />
                <circle cx="60" cy="60" r="50" className="geom ring-outer-dark" pathLength="100" />
                <circle cx="60" cy="60" r="50" className="geom ring-outer-light" pathLength="100" />
              </g>
            </svg>
          </div>

          <div className="animated-text-container">
            <svg viewBox="0 0 420 60" className="text-loader-svg" aria-label="Tc&Rh Convert">
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" className="base-typography">
                <tspan className="text-brand">TC&amp;RH</tspan>
                <tspan className="text-convert-filled" dx="12">CONVERT</tspan>
              </text>
            </svg>
          </div>
        </section>
      </main>
    </>
  );
}