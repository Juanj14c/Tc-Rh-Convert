"use client";

import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";

import IntroAnimation from "@/components/layout/IntroAnimation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [showIntro, setShowIntro] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Ingresa tu correo electrónico.",
      );
      return;
    }

    if (!password) {
      setError(
        "Ingresa tu contraseña.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        setError(
          "No fue posible iniciar sesión. Verifica tu correo y contraseña.",
        );
        setIsLoading(false);
        return;
      }

      /*
       * Login correcto.
       *
       * La sesión queda gestionada por Supabase.
       * Mostramos primero la animación y después
       * entramos al Mural.
       */
      setShowIntro(true);
    } catch {
      setError(
        "No fue posible iniciar sesión. Inténtalo nuevamente.",
      );

      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  /*
   * =========================================
   * ANIMACIÓN DESPUÉS DEL LOGIN
   * =========================================
   */

  if (showIntro) {
    return (
      <IntroAnimation
        onComplete={() => {
          router.replace("/mural");
        }}
      />
    );
  }

  /*
   * =========================================
   * LOGIN
   * =========================================
   */

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
            alt="Convertia"
            className="login-brand-panel__logo-image"
          />

          <h1>T&amp;C RH</h1>

          <p>
            Plataforma interna para conectar
            talento, cultura y comunicación
            dentro de la organización.
          </p>

          <div className="login-brand-panel__features">
            <span>Talento</span>
            <span>Cultura</span>
            <span>Comunicación</span>
            <span>Bienestar</span>
          </div>
        </div>
      </section>

      {/* =========================================
          PANEL DE LOGIN
          ========================================= */}

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <span>Bienvenido</span>

            <h2>Inicia sesión</h2>

            <p>
              Ingresa tus datos para acceder a la
              plataforma.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* =====================================
                CORREO
                ===================================== */}

            <label className="login-form__field">
              <span>
                Correo electrónico
              </span>

              <div className="login-form__input">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* =====================================
                CONTRASEÑA
                ===================================== */}

            <label className="login-form__field">
              <span>Contraseña</span>

              <div className="login-form__input">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="login-form__password-toggle"
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
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {/* =====================================
                ERROR
                ===================================== */}

            {error && (
              <div
                className="login-form__error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =====================================
                BOTÓN LOGIN
                ===================================== */}

            <button
              type="submit"
              className="login-form__submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="login-form__spinner"
                  />

                  <span>
                    Ingresando...
                  </span>
                </>
              ) : (
                <span>
                  Iniciar sesión
                </span>
              )}
            </button>

            {/* =====================================
                RECUPERAR CONTRASEÑA
                ===================================== */}

            <button
              type="button"
              className="login-form__forgot"
              onClick={
                handleForgotPassword
              }
              disabled={isLoading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          <div className="login-form__footer">
            <span>
              Acceso interno de
              Tc&amp;Rh Convert
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}