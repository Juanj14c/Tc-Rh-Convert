"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const redirectTo =
        `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo,
          },
        );

      if (resetError) {
        console.error(
          "Error solicitando recuperación:",
          resetError,
        );

        setError(
          "No fue posible enviar el enlace. Inténtalo nuevamente.",
        );

        return;
      }

      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
    } catch (resetError) {
      console.error(
        "Error inesperado en recuperación:",
        resetError,
      );

      setError(
        "No fue posible enviar el enlace. Inténtalo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* =========================================
          PANEL DE MARCA
          ========================================= */}

      <section className="login-brand-panel">
        <div className="login-brand-panel__glow login-brand-panel__glow--one" />
        <div className="login-brand-panel__glow login-brand-panel__glow--two" />

        <div className="login-brand-panel__content">
          <img
            src="/assets/brand/simbolo_claro.png"
            alt="Logo de la empresa"
            className="login-brand-panel__logo-image"
          />

          <h1>Tc&amp;Rh Convert</h1>

          <p>
            Recupera el acceso a tu cuenta
            de manera segura.
          </p>
        </div>
      </section>

      {/* =========================================
          PANEL DE RECUPERACIÓN
          ========================================= */}

      <section className="login-form-panel">
        <div className="login-form-container">
          <button
            type="button"
            className="login-form__back"
            onClick={() => router.push("/login")}
            disabled={isLoading}
          >
            <ArrowLeft size={17} />

            <span>
              Volver al inicio de sesión
            </span>
          </button>

          <div className="login-form-header">
            <span>Tc&amp;Rh Convert</span>

            <h2>
              Recuperar contraseña
            </h2>

            <p>
              Introduce tu correo y te
              enviaremos un enlace para
              recuperar tu contraseña.
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
                  disabled={isLoading}
                />
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
                className="login-form__succes"
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
                  <Loader2
                    size={18}
                    className="login-form__spinner"
                  />

                  <span>
                    Enviando...
                  </span>
                </>
              ) : (
                "Enviar enlace"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}