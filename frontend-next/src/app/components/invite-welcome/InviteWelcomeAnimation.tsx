import React, { useId } from "react";

export default function WelcomeLoader({
  title = "Tc&Rh Convert",
  name = "Bienvenido Juan",
  brandColor = "#15cb90",
  colorDark = "#064D56",
  bgColor = "#0b0d17",
}) {
  const loaderEyesId = useId();
  const loaderGradId = useId();
  const loaderMaskId = useId();

  const letters = name.split("");

  return (
    <>
      <style>{`
        :root {
          --color-dark: ${colorDark};
          --brand-color: ${brandColor};
          --bg-color: ${bgColor};
          --text-color: #ffffff;
        }

        .wc-loader-host {
          background-color: var(--bg-color);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: var(--text-color);
          width: 100%;
        }

        .wc-loader-host .main-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .wc-loader-host .brand-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--brand-color);
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(21, 203, 144, 0.3);
          margin-bottom: 1rem;
        }

        .wc-loader-host .face-loader {
          width: 12em;
          height: 12em;
          filter: drop-shadow(0 0 15px rgba(21, 203, 144, 0.2));
        }

        .wc-loader-host .loader__eye1,
        .wc-loader-host .loader__eye2,
        .wc-loader-host .loader__mouth1,
        .wc-loader-host .loader__mouth2 {
          animation: wc-eye1 3s ease-in-out infinite;
        }

        .wc-loader-host .loader__eye1,
        .wc-loader-host .loader__eye2 {
          transform-origin: 64px 64px;
        }

        .wc-loader-host .loader__eye2 {
          animation-name: wc-eye2;
        }

        .wc-loader-host .loader__mouth1 {
          animation-name: wc-mouth1;
        }

        .wc-loader-host .loader__mouth2 {
          animation-name: wc-mouth2;
          visibility: hidden;
        }

        @keyframes wc-eye1 {
          from { transform: rotate(-260deg) translate(0, -56px); }
          50%, 60% {
            animation-timing-function: cubic-bezier(0.17, 0, 0.58, 1);
            transform: rotate(-40deg) translate(0, -56px) scale(1);
          }
          to { transform: rotate(225deg) translate(0, -56px) scale(0.35); }
        }

        @keyframes wc-eye2 {
          from { transform: rotate(-260deg) translate(0, -56px); }
          50% { transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1); }
          52.5% { transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1, 0); }
          55%, 70% {
            animation-timing-function: cubic-bezier(0, 0, 0.28, 1);
            transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1);
          }
          to { transform: rotate(150deg) translate(0, -56px) scale(0.4); }
        }

        @keyframes wc-mouth1 {
          from {
            animation-timing-function: ease-in;
            stroke-dasharray: 0 351.86;
            stroke-dashoffset: 0;
          }
          25% {
            animation-timing-function: ease-out;
            stroke-dasharray: 175.93 351.86;
            stroke-dashoffset: 0;
          }
          50% {
            animation-timing-function: steps(1, start);
            stroke-dasharray: 175.93 351.86;
            stroke-dashoffset: -175.93;
            visibility: visible;
          }
          75%, to { visibility: hidden; }
        }

        @keyframes wc-mouth2 {
          from {
            animation-timing-function: steps(1, end);
            visibility: hidden;
          }
          50% {
            animation-timing-function: ease-in-out;
            visibility: visible;
            stroke-dashoffset: 0;
          }
          to { stroke-dashoffset: -351.86; }
        }

        .wc-loader-host .text-loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          font-family: 'Segoe UI', "Poppins", sans-serif;
          font-size: 1.8em;
          font-weight: 600;
          user-select: none;
          color: rgba(255, 255, 255, 0.1);
        }

        .wc-loader-host .text-effect-layer {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
          background-color: transparent;
          mask: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 6px,
            black 7px,
            black 8px
          );
          -webkit-mask: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 6px,
            black 7px,
            black 8px
          );
        }

        .wc-loader-host .text-effect-layer::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle at 50% 50%, var(--brand-color) 0%, transparent 50%),
            radial-gradient(circle at 45% 45%, var(--color-dark) 0%, transparent 45%),
            radial-gradient(circle at 55% 55%, var(--brand-color) 0%, transparent 45%),
            radial-gradient(circle at 45% 55%, #ffffff 0%, transparent 45%);
          mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
          -webkit-mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
          animation:
            wc-transform-anim 2s infinite alternate,
            wc-opacity-anim 4s infinite;
          animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
        }

        @keyframes wc-transform-anim {
          0% { transform: translate(-55%); }
          100% { transform: translate(55%); }
        }

        @keyframes wc-opacity-anim {
          0%, 100% { opacity: 0; }
          15% { opacity: 1; }
          65% { opacity: 0; }
        }

        .wc-loader-host .loader-letter {
          display: inline-block;
          opacity: 0;
          animation: wc-letter-anim 4s infinite linear;
          z-index: 2;
          min-width: 0.3em;
        }

        @keyframes wc-letter-anim {
          0% { opacity: 0; }
          5% {
            opacity: 1;
            text-shadow: 0 0 4px var(--brand-color);
            transform: scale(1.1) translateY(-2px);
          }
          20% { opacity: 0.5; color: var(--brand-color); }
          100% { opacity: 0; }
        }
      `}</style>

      <div className="wc-loader-host">
        <div className="main-container">
          <svg viewBox="0 0 128 128" className="face-loader">
            <defs>
              <clipPath id={loaderEyesId}>
                <circle
                  transform="rotate(-40,64,64) translate(0,-56)"
                  r="8"
                  cy="64"
                  cx="64"
                  className="loader__eye1"
                />
                <circle
                  transform="rotate(40,64,64) translate(0,-56)"
                  r="8"
                  cy="64"
                  cx="64"
                  className="loader__eye2"
                />
              </clipPath>

              <linearGradient
                y2="1"
                x2="0"
                y1="0"
                x1="0"
                id={loaderGradId}
              >
                <stop stopColor="#000" offset="0%" />
                <stop stopColor="#fff" offset="100%" />
              </linearGradient>

              <mask id={loaderMaskId}>
                <rect
                  fill={`url(#${loaderGradId})`}
                  height="128"
                  width="128"
                  y="0"
                  x="0"
                />
              </mask>
            </defs>

            <g
              strokeDasharray="175.93 351.86"
              strokeWidth="12"
              strokeLinecap="round"
            >
              <g>
                <rect
                  clipPath={`url(#${loaderEyesId})`}
                  height="64"
                  width="128"
                  fill="var(--color-dark)"
                />

                <g stroke="var(--color-dark)" fill="none">
                  <circle
                    transform="rotate(180,64,64)"
                    r="56"
                    cy="64"
                    cx="64"
                    className="loader__mouth1"
                  />
                  <circle
                    transform="rotate(0,64,64)"
                    r="56"
                    cy="64"
                    cx="64"
                    className="loader__mouth2"
                  />
                </g>
              </g>

              <g mask={`url(#${loaderMaskId})`}>
                <rect
                  clipPath={`url(#${loaderEyesId})`}
                  height="64"
                  width="128"
                  fill="var(--brand-color)"
                />

                <g stroke="var(--brand-color)" fill="none">
                  <circle
                    transform="rotate(180,64,64)"
                    r="56"
                    cy="64"
                    cx="64"
                    className="loader__mouth1"
                  />
                  <circle
                    transform="rotate(0,64,64)"
                    r="56"
                    cy="64"
                    cx="64"
                    className="loader__mouth2"
                  />
                </g>
              </g>
            </g>
          </svg>

          <div className="brand-title">{title}</div>

          <div className="text-loader-wrapper">
            {letters.map((char, index) => (
              <span
                key={index}
                className="loader-letter"
                style={{
                  animationDelay: `${(index + 1) * 0.1}s`,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}

            <div className="text-effect-layer" />
          </div>
        </div>
      </div>
    </>
  );
}
