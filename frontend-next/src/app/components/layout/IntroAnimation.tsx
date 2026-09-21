"use client";

import { useEffect } from "react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({
  onComplete,
}: IntroAnimationProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="intro-animation">
      <div className="intro-animation__glow" />

      <div className="intro-animation__brand">
        <div className="intro-animation__logo">
          <img
            src="/assets/brand/simbolo_claro.png"
            alt="Convertia"
            className="intro-animation__logo-image"
          />
        </div>

        <span>Bienvenido a T&amp;C RH</span>
      </div>
    </div>
  );
}