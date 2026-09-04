import { useState } from "react";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import companyLogo from "../assets/brand/simbolo_claro.png"
interface LoginPageProps {
  onLogin: (role: "admin" | "employee") => void;
  onForgotPassword: () => void;
}

function LoginPage({
  onLogin,
  onForgotPassword,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);

    // TEMPORAL:
    // Luego esto será reemplazado por la autenticación real.
    window.setTimeout(() => {
      const role = email.toLowerCase().includes("admin")
        ? "admin"
        : "employee";

      setIsLoading(false);
      onLogin(role);
    }, 700);
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-panel__glow login-brand-panel__glow--one" />
        <div className="login-brand-panel__glow login-brand-panel__glow--two" />

        <div className="login-brand-panel__content">
          <img
  src={companyLogo}
  alt="Logo de la empresa"
  className="login-brand-panel__logo-image"
/>

          <h1>Tc&Rh-Convert</h1>

          <p>
            Plataforma interna para comunicación, acompañamiento
            y gestión de nuestros colaboradores.
          </p>

          <div className="login-brand-panel__features">
            <span>Comunicación interna</span>
            <span>Evaluaciones</span>
            <span>Acompañamiento T&C</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <span>Tc&Rh Convert</span>

            <h2>Iniciar sesión</h2>

            <p>
              Ingresa tus credenciales para acceder a la plataforma.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <label>
              Correo electrónico

              <div className="login-form__input">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              Contraseña

              <div className="login-form__input">
                <Lock size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="login-form__error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-form__submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-form__loader" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="login-form__forgot"
            onClick={onForgotPassword}
          >
            No recuerdo mi contraseña
          </button>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;