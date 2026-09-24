"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [isRecoveryReady, setIsRecoveryReady] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const initializeRecovery = async () => {
      const supabase = createClient();

      try {
        const url = new URL(
          window.location.href,
        );

        const code =
          url.searchParams.get("code");

        /*
         * Cuando Supabase entrega un código de recuperación
         * por URL, lo intercambiamos por una sesión.
         */
        if (code) {
          const {
            error: exchangeError,
          } =
            await supabase.auth.exchangeCodeForSession(
              code,
            );

          if (exchangeError) {
            console.error(
              "Error intercambiando código de recuperación:",
              exchangeError,
            );

            if (isMounted) {
              setError(
                "Este enlace de recuperación no es válido o ya expiró.",
              );
              setIsRecoveryReady(false);
            }

            return;
          }
        }

        /*
         * Confirmamos que existe una sesión válida
         * después del intercambio o del flujo
         * automático de Supabase.
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) {
            setError(
              "El enlace de recuperación no es válido o ya expiró.",
            );
            setIsRecoveryReady(false);
          }

          return;
        }

        if (isMounted) {
          setIsRecoveryReady(true);
        }

        /*
         * Limpiamos el código de la barra de direcciones
         * después de haberlo procesado.
         */
        window.history.replaceState(
          {},
          "",
          "/reset-password",
        );
      } catch (initializationError) {
        console.error(
          "Error inicializando recuperación:",
          initializationError,
        );

        if (isMounted) {
          setError(
            "No fue posible validar el enlace de recuperación.",
          );

          setIsRecoveryReady(false);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void initializeRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isLoading ||
      !isRecoveryReady
    ) {
      return;
    }

    setError("");
    setMessage("");

    if (!password) {
      setError(
        "Ingresa tu nueva contraseña.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Confirma tu nueva contraseña.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error(
          "Error actualizando contraseña:",
          updateError,
        );

        setError(
          "No fue posible actualizar la contraseña. Inténtalo nuevamente.",
        );

        return;
      }

      setMessage(
        "Tu contraseña fue actualizada correctamente.",
      );

      setPassword("");
      setConfirmPassword("");

      /*
       * Cerramos la sesión de recuperación
       * y devolvemos al usuario al login.
       */
      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (updateError) {
      console.error(
        "Error inesperado actualizando contraseña:",
        updateError,
      );

      setError(
        "No fue posible actualizar la contraseña. Inténtalo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================
     CARGANDO / VALIDANDO ENLACE
     ========================================= */

  if (isInitializing) {
    return (
      <main className="login-page">
        <section className="login-form-panel">
          <div className="login-form-container">
            <div className="login-form-header">
              <span>Tc&amp;Rh Convert</span>

              <h2>
                Validando enlace
              </h2>

              <p>
                Estamos verificando tu enlace
                de recuperación.
              </p>
            </div>

            <div className="login-form__loading">
              <Loader2
                size={22}
                className="login-form__spinner"
              />

              <span>
                Un momento...
              </span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* =========================================
     ENLACE INVÁLIDO
     ========================================= */

  if (!isRecoveryReady) {
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

            <h1>Tc&amp;Rh Convert</h1>

            <p>
              Recupera el acceso a tu cuenta
              de manera segura.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-container">
            <button
              type="button"
              className="login-form__back"
              onClick={() =>
                router.replace(
                  "/forgot-password",
                )
              }
            >
              <ArrowLeft size={17} />

              <span>
                Volver a recuperar la contraseña
              </span>
            </button>

            <div className="login-form-header">
              <span>Tc&amp;Rh Convert</span>

              <h2>
                Enlace no válido
              </h2>

              <p>
                {error ||
                  "El enlace de recuperación no es válido o ya expiró."}
              </p>
            </div>

            <button
              type="button"
              className="login-form__submit"
              onClick={() =>
                router.replace(
                  "/forgot-password",
                )
              }
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* =========================================
     FORMULARIO
     ========================================= */

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

          <h1>Tc&amp;Rh Convert</h1>

          <p>
            Establece una nueva contraseña
            para recuperar tu acceso.
          </p>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <button
            type="button"
            className="login-form__back"
            onClick={() =>
              router.push("/login")
            }
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
              Nueva contraseña
            </h2>

            <p>
              Crea una nueva contraseña
              para recuperar el acceso a
              tu cuenta.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* NUEVA CONTRASEÑA */}

            <label className="login-form__field">
              <span>Nueva contraseña</span>

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
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
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

            {/* CONFIRMAR CONTRASEÑA */}

            <label className="login-form__field">
              <span>
                Confirmar contraseña
              </span>

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
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {/* ERROR */}

            {error && (
              <div
                className="login-form__error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* ÉXITO */}

            {message && (
              <div
                className="login-form__succes"
                role="status"
              >
                <Check size={17} />

                <span>{message}</span>
              </div>
            )}

            {/* BOTÓN */}

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
                    Actualizando...
                  </span>
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}