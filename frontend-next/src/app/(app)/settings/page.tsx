"use client";

import { useRef, useState } from "react";

import {
  Camera,
  Check,
  Lock,
  Save,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

function SettingsPage() {
  const {
    profile,
    isAdmin,
    setProfile,
  } = useProfile();

  const [
    selectedImagePreview,
    setSelectedImagePreview,
  ] = useState("");

  const [
    selectedImageFile,
    setSelectedImageFile,
  ] = useState<File | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Si no hay una imagen nueva seleccionada,
   * mostramos la imagen que viene de Supabase.
   *
   * Si el usuario selecciona una imagen nueva,
   * mostramos su preview local.
   */
  const imagePreview =
    selectedImagePreview ||
    profile.image ||
    "";

  const country =
    profile.countryName ?? "";

  const area =
    profile.area ?? "";

  const campaign =
    profile.campaign ?? "";

  const entryDate =
    profile.entryDate ?? "";

  /*
   * =========================
   * CAMBIAR FOTO
   * =========================
   */

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSaved(false);

    if (!file.type.startsWith("image/")) {
      setError(
        "Selecciona un archivo de imagen válido.",
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "La imagen no puede superar los 5 MB.",
      );

      event.target.value = "";
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedImagePreview(
      previewUrl,
    );

    setSelectedImageFile(file);

    event.target.value = "";
  };

  /*
   * =========================
   * GUARDAR FOTO
   * =========================
   */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedImageFile) {
      return;
    }

    setIsSaving(true);
    setSaved(false);
    setError("");

    try {
      const supabase =
        createClient();

      /*
       * Usuario autenticado
       */
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "No se pudo identificar al usuario.",
        );
      }

      /*
       * Conservamos únicamente la extensión
       * permitida por el selector.
       */
      const fileExtension =
        selectedImageFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      /*
       * Cada usuario tiene su propia carpeta.
       *
       * avatars/
       *   USER_ID/
       *     avatar-....jpg
       */
      const filePath =
        `${user.id}/avatar-${Date.now()}.${fileExtension}`;

      /*
       * Subimos la nueva foto.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          selectedImageFile,
          {
            contentType:
              selectedImageFile.type,
            cacheControl: "3600",
            upsert: false,
          },
        );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * Guardamos únicamente la ruta
       * dentro de profiles.
       */
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url:
            filePath,
        })
        .eq(
          "id",
          user.id,
        );

      if (profileError) {
        /*
         * Si la actualización del perfil falla,
         * eliminamos la foto que acabamos de subir.
         */
        await supabase.storage
          .from("avatars")
          .remove([
            filePath,
          ]);

        throw profileError;
      }

      /*
       * Como el bucket es privado,
       * necesitamos una URL firmada.
       */
      const {
        data: signedData,
        error: signedUrlError,
      } =
        await supabase.storage
          .from("avatars")
          .createSignedUrl(
            filePath,
            60 * 60,
          );

      if (signedUrlError) {
        throw signedUrlError;
      }

      /*
       * Eliminamos la foto anterior
       * después de guardar correctamente
       * la nueva.
       */
      if (
        profile.avatarPath &&
        profile.avatarPath !==
          filePath
      ) {
        const {
          error: removeOldError,
        } =
          await supabase.storage
            .from("avatars")
            .remove([
              profile.avatarPath,
            ]);

        if (removeOldError) {
          console.error(
            "No se pudo eliminar la foto anterior:",
            removeOldError,
          );
        }
      }

      const signedUrl =
        signedData.signedUrl;

      /*
       * Ya no necesitamos el preview local.
       * Ahora utilizamos la URL firmada real.
       */
      setSelectedImagePreview(
        "",
      );

      setSelectedImageFile(
        null,
      );

      /*
       * Actualizamos el contexto para que
       * Header y Settings cambien inmediatamente.
       */
      setProfile({
        ...profile,
        image: signedUrl,
        avatarPath: filePath,
      });

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (saveError) {
      console.error(
        "Error guardando la foto:",
        saveError,
      );

      setError(
        "No se pudo guardar la foto de perfil. Inténtalo nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
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
        {/* =========================
            PERFIL
           ========================= */}

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
                disabled={isSaving}
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

          {error && (
            <div
              className="settings-form__error"
              role="alert"
            >
              {error}
            </div>
          )}

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

    
          
          
          </div>
        </section>

        {/* =========================
            INFORMACIÓN LABORAL
           ========================= */}

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

        {/* =========================
            PREFERENCIAS
           ========================= */}

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
            disabled={
              isSaving ||
              !selectedImageFile
            }
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
                Guardar foto
              </>
            )}
          </button>
        </section>
      </div>
    </section>
  );
}

export default SettingsPage;    