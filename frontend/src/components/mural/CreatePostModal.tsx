import { useState } from "react";
import { Image, X } from "lucide-react";

export type PostAudience =
  | "all"
  | "campaign"
  | "area"
  | "country";

export interface NewPost {
  title: string;
  content: string;
  audience: PostAudience;
  audienceValue?: string;
  image?: string;
  link?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (post: NewPost) => void;
  mode?: "create" | "edit";
  initialPost?: NewPost;
}

const mockCampaigns = [
  "Campaña A",
  "Campaña B",
  "Campaña C",
];

const mockAreas = [
  "Financiera",
  "Operaciones",
  "Talento & Cultura",
  "Servicio al Cliente",
];

const mockCountries = [
  "Argentina",
  "Colombia",
  "México",
  "Perú",
  "Chile",
];

function CreatePostModal({
  isOpen,
  onClose,
  onCreatePost,
  mode = "create",
  initialPost,
}: CreatePostModalProps) {
  const [title, setTitle] = useState(
    initialPost?.title ?? "",
  );

  const [content, setContent] = useState(
    initialPost?.content ?? "",
  );

  const [audience, setAudience] =
    useState<PostAudience>(
      initialPost?.audience ?? "all",
    );

  const [audienceValue, setAudienceValue] =
    useState(
      initialPost?.audienceValue ?? "",
    );

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState(initialPost?.image ?? "");

  const [link, setLink] = useState(
    initialPost?.link ?? "",
  );

  if (!isOpen) {
    return null;
  }

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      setImageFile(file);
      setImagePreview(reader.result);
    };

    reader.onerror = () => {
      setImageFile(null);
      setImagePreview("");
    };

    reader.readAsDataURL(file);
  };

  const handleAudienceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newAudience =
      event.target.value as PostAudience;

    setAudience(newAudience);
    setAudienceValue("");
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    if (
      audience !== "all" &&
      !audienceValue
    ) {
      return;
    }

    onCreatePost({
      title: title.trim(),
      content: content.trim(),
      audience,
      audienceValue:
        audience === "all"
          ? undefined
          : audienceValue,
      image: imagePreview || undefined,
      link: link.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setAudience("all");
    setAudienceValue("");
    setImageFile(null);
    setImagePreview("");
    setLink("");

    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="create-post-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="create-post-modal__header">
            <div>
              <span className="create-post-modal__eyebrow">
                Talento & Cultura
              </span>

              <h2>
                {mode === "edit"
                  ? "Editar publicación"
                  : "Nueva publicación"}
              </h2>
            </div>

            <button
              type="button"
              className="create-post-modal__close"
              onClick={handleClose}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="create-post-modal__body">
            <label>
              Título

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Escribe el título de la publicación"
              />
            </label>

            <label>
              Contenido

              <textarea
                rows={5}
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Escribe el contenido que quieres compartir..."
              />
            </label>

            <div className="create-post-modal__field">
              <span>Imagen</span>

              <input
                id="post-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                hidden
              />

              <label
                htmlFor="post-image"
                className="create-post-modal__upload"
              >
                <Image size={18} />

                <span>
                  {imageFile
                    ? imageFile.name
                    : "Seleccionar imagen"}
                </span>
              </label>

              {imagePreview && (
                <div className="create-post-modal__preview">
                  <img
                    src={imagePreview}
                    alt="Vista previa de la publicación"
                  />
                </div>
              )}
            </div>

            <label>
              Enlace

              <input
                type="url"
                value={link}
                onChange={(event) =>
                  setLink(event.target.value)
                }
                placeholder="https://ejemplo.com"
              />
            </label>

            <label>
              Publicar para

              <select
                value={audience}
                onChange={handleAudienceChange}
              >
                <option value="all">
                  Todos los empleados
                </option>

                <option value="campaign">
                  Una campaña
                </option>

                <option value="area">
                  Un área
                </option>

                <option value="country">
                  Un país
                </option>
              </select>
            </label>

            {audience === "campaign" && (
              <label>
                Campaña

                <select
                  value={audienceValue}
                  onChange={(event) =>
                    setAudienceValue(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona una campaña
                  </option>

                  {mockCampaigns.map(
                    (campaign) => (
                      <option
                        key={campaign}
                        value={campaign}
                      >
                        {campaign}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}

            {audience === "area" && (
              <label>
                Área

                <select
                  value={audienceValue}
                  onChange={(event) =>
                    setAudienceValue(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona un área
                  </option>

                  {mockAreas.map((area) => (
                    <option
                      key={area}
                      value={area}
                    >
                      {area}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {audience === "country" && (
              <label>
                País

                <select
                  value={audienceValue}
                  onChange={(event) =>
                    setAudienceValue(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona un país
                  </option>

                  {mockCountries.map(
                    (country) => (
                      <option
                        key={country}
                        value={country}
                      >
                        {country}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
          </div>

          <div className="create-post-modal__footer">
            <button
              type="button"
              className="create-post-modal__cancel"
              onClick={handleClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="create-post-modal__submit"
            >
              {mode === "edit"
                ? "Guardar cambios"
                : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;