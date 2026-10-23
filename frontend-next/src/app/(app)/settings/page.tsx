
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

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
    refreshProfile,
  } = useProfile();

  const [selectedImagePreview, setSelectedImagePreview] =
    useState("");

  const [selectedImageFile, setSelectedImageFile] =
    useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /*
   * Volvemos a consultar el perfil al entrar
   * en Configuración.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshProfile();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshProfile]);

  /*
   * Liberamos las URL de vista previa locales
   * al sustituir una imagen o desmontar la página.
   */
  useEffect(() => {
    return () => {
      if (selectedImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const imagePreview =
    selectedImagePreview || profile.image || "";

  const country = profile.countryName ?? "";
  const area = profile.area ?? "";
  const campaign = profile.campaign ?? "";
  const entryDate = (profile.entryDate ?? "").slice(0, 10);

  const employeeType =
    profile.employeeType?.trim().toLowerCase() ?? "";

  /*
   * CAMBIAR FOTO DE PERFIL
   */
  const handleProfileImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSaved(false);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Selecciona una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImagePreview(previewUrl);
    setSelectedImageFile(file);

    event.target.value = "";
  };

  /*
   * GUARDAR FOTO EN SUPABASE STORAGE
   */
  const handleSavePhoto = async () => {
    if (isSaving || !selectedImageFile) return;

    setIsSaving(true);
    setSaved(false);
    setError("");

    let uploadedFilePath = "";

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "No se pudo identificar al usuario autenticado.",
        );
      }

      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const extension =
        extensionByType[selectedImageFile.type];

      if (!extension) {
        throw new Error("El formato de imagen no es válido.");
      }

      /*
       * Cada usuario guarda su foto en su propia carpeta.
       */
      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedImageFile, {
          contentType: selectedImageFile.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedFilePath = filePath;

      /*
       * Guardamos la ruta del archivo, no la imagen
       * como una cadena base64, en profiles.avatar_url.
       */
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: filePath,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      /*
       * El bucket es privado; creamos una URL firmada
       * para mostrar la fotografía.
       */
      const {
        data: signedData,
        error: signedUrlError,
      } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 60 * 60);

      if (signedUrlError || !signedData?.signedUrl) {
        throw signedUrlError ??
          new Error("No se pudo generar la URL de la fotografía.");
      }

      /*
       * Actualizamos el contexto para que la foto
       * cambie inmediatamente en Configuración y Header.
       */
      setProfile({
        ...profile,
        image: signedData.signedUrl,
        avatarPath: filePath,
      });

      /*
       * Si todo salió correctamente, intentamos retirar
       * la foto anterior para no acumular archivos.
       */
      if (
        profile.avatarPath &&
        profile.avatarPath !== filePath
      ) {
        const { error: removeOldError } =
          await supabase.storage
            .from("avatars")
            .remove([profile.avatarPath]);

        if (removeOldError) {
          console.error(
            "No se pudo eliminar la foto anterior:",
            removeOldError,
          );
        }
      }

      setSelectedImagePreview("");
      setSelectedImageFile(null);
      setSaved(true);
    } catch (saveError) {
      console.error(
        "Error guardando la foto de perfil:",
        saveError,
      );

      /*
       * Si la subida se completó, pero otro paso falló,
       * intentamos retirar el archivo nuevo para no dejar
       * un archivo huérfano.
       */
      if (uploadedFilePath) {
        const supabase = createClient();

        const { error: cleanupError } =
          await supabase.storage
            .from("avatars")
            .remove([uploadedFilePath]);

        if (cleanupError) {
          console.error(
            "No se pudo limpiar la imagen incompleta:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la foto. Inténtalo nuevamente.",
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
          Administra tu información personal y preferencias
          de la plataforma.
        </p>
      </div>

      <div className="settings-grid">
        {/* PERFIL */}

        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h2>Perfil</h2>

              <p>
                Información asociada a tu cuenta.
              </p>
            </div>
          </div>

          <div className="settings-profile">
            <div className="settings-profile__avatar-wrapper">
              <div className="settings-profile__avatar">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={`Foto de perfil de ${profile.name || "usuario"}`}
                    className="settings-profile__avatar-image"
                  />
                ) : (
                  profile.name
                    ?.trim()
                    .split(/\s+/)
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "US"
                )}
              </div>

              {/* LA CAMARITA SE CONSERVA AQUÍ */}

              <input
                ref={fileInputRef}
                id="profile-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfileImageChange}
                hidden
              />

              <button
                type="button"
                className="settings-profile__camera"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
                disabled={isSaving}
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <strong>{profile.name || "Usuario"}</strong>

              <span>
                {isAdmin ? "Admin T&C" : "Empleado"}
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
            <label>
              Nombre

              <input
                type="text"
                value={profile.name}
                readOnly
                aria-readonly="true"
              />
            </label>

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

        {/* INFORMACIÓN LABORAL */}

        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h2>Información laboral</h2>

              <p>
                Datos utilizados por los módulos de TcRh convert.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <label>
              País

              <input
                type="text"
                value={country}
                readOnly
                aria-readonly="true"
              />
            </label>

            <label>
              Área

              <input
                type="text"
                value={area}
                readOnly
                aria-readonly="true"
              />
            </label>

            {employeeType !== "planta" && (
              <label>
                Campaña

                <input
                  type="text"
                  value={campaign}
                  readOnly
                  aria-readonly="true"
                />
              </label>
            )}

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
              Estos datos son administrados por Talento &amp;
              Cultura y provienen de la información oficial
              del empleado.
            </p>
          </div>
        </section>

        {/* PREFERENCIAS */}

        <section className="settings-card settings-card--full">
          <div className="settings-card__header">
            <div>
              <h2>Preferencias</h2>

              <p>
                Configura cómo quieres utilizar TcRh convert.
              </p>
            </div>
          </div>

          <label className="settings-toggle">
            <div>
              <strong>Notificaciones</strong>

              <span>
                Recibir alertas de nuevas actividades.
              </span>
            </div>

            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) =>
                setNotifications(event.target.checked)
              }
            />
          </label>

          {/* Guardar solo aparece cuando hay una foto nueva */}

          <button
            type="button"
            className="settings-save"
            onClick={handleSavePhoto}
            disabled={isSaving || !selectedImageFile}
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
