
"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import InviteWelcomeAnimation from "@/components/invite-welcome/InviteWelcomeAnimation";

type Stage = "loading" | "password" | "welcome";

export default function InviteAcceptPage() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [name, setName] = useState("Bienvenido");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fading, setFading] = useState(false);

  // Verifica la invitación o recupera la sesión ya creada
  // por la ruta /auth/confirm.
  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      try {
        const supabase = createClient();

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );

        const tokenHash = hashParams.get("token_hash");
        const type = hashParams.get("type");

        // Compatibilidad con invitaciones que llegan directamente
        // con token_hash en el fragmento de la URL.
        if (tokenHash || type) {
          if (!tokenHash || type !== "invite") {
            router.replace("/login?error=invalid-invite");
            return;
          }

          // Retira el token de la barra del navegador.
          window.history.replaceState(
            {},
            document.title,
            `${window.location.pathname}${window.location.search}`,
          );

          const { error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "invite",
            });

          if (cancelled) return;

          if (verifyError) {
            router.replace("/login?error=invite-expired");
            return;
          }
        }

        // Si /auth/confirm ya verificó el enlace, debe existir
        // una sesión válida aunque la URL no tenga token_hash.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userError || !user) {
          router.replace("/login?error=invite-session-missing");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        const profileName =
          profile?.name?.trim() ||
          user.user_metadata?.name?.trim() ||
          user.user_metadata?.full_name?.trim() ||
          user.user_metadata?.display_name?.trim() ||
          user.email?.split("@")[0] ||
          "";

        setName(
          profileName ? `Bienvenido ${profileName}` : "Bienvenido",
        );

        setStage("password");
      } catch {
        if (!cancelled) {
          router.replace("/login?error=invite-verification-failed");
        }
      }
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Al guardar la contraseña correctamente, muestra la animación
  // original y después redirige al mural.
  useEffect(() => {
    if (stage !== "welcome") return;

    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, 4200);

    const redirectTimer = window.setTimeout(() => {
      router.replace("/mural");
    }, 5100);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [stage, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // Comprueba que el empleado conserve la sesión de la invitación.
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError || !user) {
        router.replace("/login?error=invite-session-missing");
        return;
      }

      // Guarda la contraseña en Supabase Auth.
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          "No se pudo guardar la contraseña. " +
            "Comprueba los requisitos de seguridad e inténtalo de nuevo.",
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setStage("welcome");
    } catch {
      setError(
        "Ocurrió un problema al guardar la contraseña. Inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (stage === "loading") {
    return (
      <main className="invite-screen invite-loading">
        <div className="invite-spinner" />
        <p>Verificando tu invitación...</p>

        <style jsx>{`
          .invite-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 18px;
            padding: 24px;
            box-sizing: border-box;
            background: #0b0d17;
            color: white;
            font-family: "Segoe UI", system-ui, sans-serif;
          }

          .invite-spinner {
            width: 38px;
            height: 38px;
            border: 3px solid rgba(21, 203, 144, 0.2);
            border-top-color: #15cb90;
            border-radius: 50%;
            animation: invite-spin 800ms linear infinite;
          }

          p {
            margin: 0;
            color: #cbd5e1;
          }

          @keyframes invite-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .invite-spinner {
              animation-duration: 2s;
            }
          }
        `}</style>
      </main>
    );
  }

  if (stage === "welcome") {
    return (
      <main
        className={`invite-welcome-transition ${
          fading ? "invite-welcome-transition--fade" : ""
        }`}
      >
        <InviteWelcomeAnimation name={name} />

        <style jsx>{`
          .invite-welcome-transition {
            min-height: 100vh;
            opacity: 1;
            transition: opacity 900ms ease-in-out;
          }

          .invite-welcome-transition--fade {
            opacity: 0;
          }

          @media (prefers-reduced-motion: reduce) {
            .invite-welcome-transition {
              transition-duration: 150ms;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="invite-screen">
      <section className="password-card">
        <div className="brand-mark" aria-hidden="true">
          <span className="brand-dot" />
          <span>Tc&amp;Rh Convert</span>
        </div>

        <div className="heading">
          <span className="eyebrow">INVITACIÓN ACEPTADA</span>
          <h1>Crea tu contraseña</h1>
          <p>
            Configura tu contraseña personal para proteger tu cuenta
            y comenzar a utilizar la plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="invite-password">Nueva contraseña</label>

            <input
              id="invite-password"
              name="password"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              disabled={saving}
            />
          </div>

          <div className="field">
            <label htmlFor="invite-confirm-password">
              Confirmar contraseña
            </label>

            <input
              id="invite-confirm-password"
              name="confirmPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Escribe nuevamente tu contraseña"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={8}
              required
              disabled={saving}
            />
          </div>

          <label className="show-password">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(event) =>
                setShowPasswords(event.target.checked)
              }
              disabled={saving}
            />
            Mostrar contraseñas
          </label>

          <p className="password-hint">
            Utiliza una contraseña segura que no compartas con otras
            personas.
          </p>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="button-spinner" />
                Guardando contraseña...
              </>
            ) : (
              "Guardar contraseña"
            )}
          </button>
        </form>

        <p className="footer-note">
          Tu cuenta estará lista después de completar este paso.
        </p>
      </section>

      <style jsx>{`
        .invite-screen {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 32px 18px;
          box-sizing: border-box;
          background:
            radial-gradient(
              ellipse at top,
              rgba(21, 203, 144, 0.1),
              transparent 55%
            ),
            #0b0d17;
          color: #f8fafc;
          font-family: "Segoe UI", system-ui, sans-serif;
        }

        .password-card {
          width: 100%;
          max-width: 440px;
          padding: 36px;
          box-sizing: border-box;
          background: rgba(17, 24, 39, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 22px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 34px;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .brand-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #15cb90;
          box-shadow: 0 0 18px rgba(21, 203, 144, 0.6);
        }

        .heading {
          text-align: center;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: #15cb90;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        h1 {
          margin: 12px 0;
          font-size: clamp(25px, 5vw, 31px);
          line-height: 1.2;
          letter-spacing: -0.8px;
        }

        .heading p {
          margin: 0;
          color: #aab6c8;
          font-size: 14px;
          line-height: 1.7;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .field label {
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
        }

        .field input {
          width: 100%;
          min-height: 48px;
          padding: 13px 14px;
          box-sizing: border-box;
          border: 1px solid #334155;
          border-radius: 10px;
          outline: none;
          background: #0b1220;
          color: #f8fafc;
          font: inherit;
          font-size: 14px;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .field input::placeholder {
          color: #64748b;
        }

        .field input:focus {
          border-color: #15cb90;
          box-shadow: 0 0 0 3px rgba(21, 203, 144, 0.13);
        }

        .field input:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .show-password {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #cbd5e1;
          font-size: 13px;
          cursor: pointer;
        }

        .show-password input {
          accent-color: #15cb90;
          width: 15px;
          height: 15px;
        }

        .password-hint {
          margin: -7px 0 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
        }

        .error-message {
          margin: 0;
          padding: 12px;
          border: 1px solid rgba(248, 113, 113, 0.25);
          border-radius: 9px;
          background: rgba(127, 29, 29, 0.16);
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.5;
        }

        button {
          min-height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 2px;
          padding: 13px 16px;
          border: 0;
          border-radius: 10px;
          background: #15cb90;
          color: #052e26;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 160ms ease,
            transform 160ms ease;
        }

        button:hover:not(:disabled) {
          background: #36e3ac;
          transform: translateY(-1px);
        }

        button:focus-visible {
          outline: 3px solid rgba(21, 203, 144, 0.45);
          outline-offset: 3px;
        }

        button:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .button-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(5, 46, 38, 0.25);
          border-top-color: #052e26;
          border-radius: 50%;
          animation: invite-spin 700ms linear infinite;
        }

        .footer-note {
          margin: 24px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
          text-align: center;
        }

        @keyframes invite-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .password-card {
            padding: 28px 22px;
            border-radius: 18px;
          }

          .brand-mark {
            margin-bottom: 28px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .field input,
          button {
            transition-duration: 0ms;
          }

          .button-spinner {
            animation-duration: 2s;
          }
        }
      `}</style>
    </main>
  );
}
