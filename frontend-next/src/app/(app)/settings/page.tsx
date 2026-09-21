"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Check,
  Lock,
  Save,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

function SettingsPage() {
  const {
    profile,
    isAdmin,
    setProfile,
  } = useProfile();

  const [imagePreview, setImagePreview] =
    useState(profile.image ?? "");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /*
   * Datos oficiales del empleado.
   *
   * TEMPORAL:
   * más adelante vendrán desde Supabase.
   */

  const country =
    profile.countryName ??
    "Colombia";

  const area =
    profile.area ??
    "Comercial";

  const campaign =
    profile.campaign ??
    "WOM";

  const entryDate =
    profile.entryDate ?? "";

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setProfile({
      ...profile,
      image: previewUrl,
    });

    event.target.value = "";
  };

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaved(false);

    // TEMPORAL:
    // posteriormente se guardará en Supabase.

    window.setTimeout(() => {
      setProfile({
        ...profile,
        image: imagePreview,
      });

      setIsSaving(false);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    }, 800);
  };

  return (
    <section className="settings-page">
      <div className="settings-page__header">
        <span>Cuenta</span>

        <h1>Configuración</h1>

        <p>
          Administra tu información personal
          y preferencias de la plataforma.
        </p>
      </div>

      <div className="settings-grid">
        {/* PERFIL */}

        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h2>Perfil</h2>

              <p>
                Información asociada a tu
                cuenta.
              </p>
            </div>
          </div>

          <div className="settings-profile">
            <div className="settings-profile__avatar-wrapper">
              <div className="settings-profile__avatar">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Foto de perfil"
                    className="settings-profile__avatar-image"
                  />
                ) : (
                  profile.name
                    ?.split(" ")
                    .map(
                      (part) =>
                        part.charAt(0),
                    )
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ||
                  "US"
                )}
              </div>

              <input
                ref={fileInputRef}
                id="profile-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleProfileImageChange
                }
                hidden
              />

              <button
                type="button"
                className="settings-profile__camera"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <strong>
                {profile.name}
              </strong>

              <span>
                {isAdmin
                  ? "Admin T&C"
                  : "Empleado"}
              </span>
            </div>
          </div>

          <div className="settings-form">
            {/* NOMBRE */}

            <label>
              Nombre

              <input
                type="text"
                value={profile.name}
                readOnly
                aria-readonly="true"
              />
            </label>

            {/* CORREO */}

            <label>
              Correo electrónico

              <input
                type="email"
                value={profile.email}
                readOnly
                aria-readonly="true"
              />
            </label>

            {/* ROL */}

            <label>
              Rol

              <input
                type="text"
                value={
                  isAdmin
                    ? "Admin T&C"
                    : "Empleado"
                }
                readOnly
                aria-readonly="true"
              />
            </label>
          </div>
        </section>

        {/* INFORMACIÓN LABORAL */}

        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h2>
                Información laboral
              </h2>

              <p>
                Datos utilizados por los
                módulos de TcRh convert.
              </p>
            </div>
          </div>

          <div className="settings-form">
            {/* PAÍS */}

            <label>
              País

              <input
                type="text"
                value={country}
                readOnly
                aria-readonly="true"
              />
            </label>

            {/* ÁREA */}

            <label>
              Área

              <input
                type="text"
                value={area}
                readOnly
                aria-readonly="true"
              />
            </label>

            {/* CAMPAÑA */}

            <label>
              Campaña

              <input
                type="text"
                value={campaign}
                readOnly
                aria-readonly="true"
              />
            </label>

            {/* FECHA DE INGRESO */}

            <label>
              Fecha de ingreso

              <input
                type="date"
                value={entryDate}
                readOnly
                aria-readonly="true"
              />
            </label>
          </div>

          <div className="settings-notice">
            <Lock size={17} />

            <p>
              Estos datos son administrados
              por Talento & Cultura y
              provienen de la información
              oficial del empleado.
            </p>
          </div>
        </section>

        {/* PREFERENCIAS */}

        <section className="settings-card settings-card--full">
          <div className="settings-card__header">
            <div>
              <h2>Preferencias</h2>

              <p>
                Configura cómo quieres
                utilizar TcRh convert.
              </p>
            </div>
          </div>

          <label className="settings-toggle">
            <div>
              <strong>
                Notificaciones
              </strong>

              <span>
                Recibir alertas de nuevas
                actividades.
              </span>
            </div>

            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) =>
                setNotifications(
                  event.target.checked,
                )
              }
            />
          </label>

          <button
            type="button"
            className="settings-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="settings-save__loader" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <Check size={17} />
                Cambios guardados
              </>
            ) : (
              <>
                <Save size={17} />
                Guardar cambios
              </>
            )}
          </button>
        </section>
      </div>
    </section>
  );
}

export default SettingsPage;