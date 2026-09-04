import { useEffect, useRef, useState } from "react";
import { Camera, Check, Lock, Save } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}
interface SettingsPageProps {
  isAdmin: boolean;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

function SettingsPage({
  isAdmin,
  profile,
  onProfileChange,
}: SettingsPageProps) {
  const [imagePreview, setImagePreview] = useState(
    profile.image ?? "",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [area, setArea] = useState("Talento & Cultura");
  const [campaign, setCampaign] = useState("Campaña A");
  const [entryDate, setEntryDate] = useState("");
  const [notifications, setNotifications] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setImagePreview(profile.image ?? "");
  }, [profile.image]);

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
    onProfileChange({ ...profile, image: previewUrl });

    event.target.value = "";
  };

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaved(false);

    // TEMPORAL:
    // Después aquí persistiremos los datos en la BD.
    window.setTimeout(() => {
      onProfileChange({
        name,
        email,
        image: imagePreview,
      })
      
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
          Administra tu información personal y preferencias
          de la plataforma.
        </p>
      </div>

      <div className="settings-grid">
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
                    alt="Foto de perfil"
                    className="settings-profile__avatar-image"
                  />
                ) : (
                  "JP"
                )}
              </div>

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
                onClick={() =>
                  fileInputRef.current?.click()
                }
                aria-label="Cambiar foto de perfil"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <strong>{name}</strong>
              <span>
                {isAdmin ? "Admin T&C" : "Empleado"}
              </span>
            </div>
          </div>

          <div className="settings-form">
            <label>
              Nombre

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            <label>
              Correo electrónico

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </label>

            <label>
              Rol

              <input
                type="text"
                value={isAdmin ? "Admin T&C" : "Empleado"}
                readOnly
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h2>Información laboral</h2>

              <p>
                Datos utilizados por los módulos de TcRh
                convert.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <label>
              Área

              <input
                type="text"
                value={area}
                onChange={(event) =>
                  setArea(event.target.value)
                }
              />
            </label>

            <label>
              Campaña

              <input
                type="text"
                value={campaign}
                onChange={(event) =>
                  setCampaign(event.target.value)
                }
              />
            </label>

            <label>
              Fecha de ingreso

              <input
                type="date"
                value={entryDate}
                onChange={(event) =>
                  setEntryDate(event.target.value)
                }
              />
            </label>
          </div>

          <div className="settings-notice">
            <Lock size={17} />

            <p>
              Algunos datos laborales serán administrados
              por Talento & Cultura cuando conectemos la base
              de datos.
            </p>
          </div>
        </section>

        <section className="settings-card settings-card--full">
          <div className="settings-card__header">
            <div>
              <h2>Preferencias</h2>

              <p>
                Configura cómo quieres utilizar TcRh
                convert.
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