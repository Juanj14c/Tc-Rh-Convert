import companyLogo from "../../assets/brand/simbolo_claro.png"
interface IntroAnimationProps {
  onComplete: () => void;
}

function IntroAnimation({ onComplete }: IntroAnimationProps) {
  return (
    <div
      className="intro-animation"
      role="status"
      aria-label="Cargando plataforma"
      onAnimationEnd={onComplete}
    >
      <div className="intro-animation__glow" />

      <div className="intro-animation__brand">
        <img
  src={companyLogo}
  alt="Logo de la empresa"
  className="intro-animation__logo-image"
/>
        <span>Tc&Rh Convert</span>
      </div>
    </div>
  );
}

export default IntroAnimation;