"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    // Temporal mientras conectamos Supabase
    window.setTimeout(() => {
      setIsLoading(false);

      setMessage(
        "Tu contraseña ha sido actualizada correctamente.",
      );

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    }, 800);
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-panel__glow login-brand-panel__glow--one" />
        <div className="login-brand-panel__glow login-brand-panel__glow--two" />

        <div className="login-brand-panel__content">
          <img
            src="/assets/brand/simbolo_claro.png"
            alt="Logo de la empresa"
            className="login-brand-panel__logo-image"
          />

          <h1>Tc&Rh Convert</h1>

          <p>
            Actualiza tu contraseña para continuar utilizando
            la plataforma de forma segura.
          </p>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <span>Tc&Rh Convert</span>

            <h2>Nueva contraseña</h2>

            <p>
              Crea una nueva contraseña para recuperar el
              acceso a tu cuenta.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <label>
              Nueva contraseña

              <div className="login-form__input">
                <Lock size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />

                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
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

            <label>
              Confirmar contraseña

              <div className="login-form__input">
                <Lock size={18} />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />

                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div
                className="login-form__error"
                role="alert"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="login-form__success"
                role="status"
              >
                {message}
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
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}   