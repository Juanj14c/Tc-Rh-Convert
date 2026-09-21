"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  X,
} from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";

import type {
  NewPost,
  PostAudience,
  PostAttachment,
} from "@/types/mural";

import {
  muralCampaigns,
  muralAreas,
  muralCountries,
} from "@/data/mural";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (post: NewPost) => void;
  mode?: "create" | "edit";
  initialPost?: NewPost;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
];

const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".zip",
];

const audienceOptions = [
  "Todos los empleados",
  "Una campaña",
  "Un área",
  "Un país",
];

const audienceLabels: Record<PostAudience, string> = {
  all: "Todos los empleados",
  campaign: "Una campaña",
  area: "Un área",
  country: "Un país",
};

export default function CreatePostModal({
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

  const [country, setCountry] = useState(
    initialPost?.audience === "country" ||
      initialPost?.audience === "campaign"
      ? initialPost?.audienceValue ?? ""
      : "",
  );

  const [area, setArea] = useState(
    initialPost?.audience === "area"
      ? initialPost?.audienceValue ?? ""
      : "",
  );

  const [campaign, setCampaign] = useState(
    initialPost?.audience === "campaign"
      ? initialPost?.audienceValue ?? ""
      : "",
  );

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState(initialPost?.image ?? "");

  const [link, setLink] = useState(
    initialPost?.link ?? "",
  );

  const [isAudienceOpen, setIsAudienceOpen] =
    useState(false);

  const [isCampaignOpen, setIsCampaignOpen] =
    useState(false);

  const [isAreaOpen, setIsAreaOpen] =
    useState(false);

  const [isCountryOpen, setIsCountryOpen] =
    useState(false);

  const [attachments, setAttachments] =
    useState<PostAttachment[]>(
      initialPost?.attachments ?? [],
    );

  const [attachmentError, setAttachmentError] =
    useState("");

  if (!isOpen) {
    return null;
  }

  const closeAllSelects = () => {
    setIsAudienceOpen(false);
    setIsCampaignOpen(false);
    setIsAreaOpen(false);
    setIsCountryOpen(false);
  };

  /**
   * Las campañas vienen como objetos:
   * {
   *   name: string;
   *   country: string;
   * }
   *
   * CustomSelect necesita string[],
   * por eso aquí filtramos por país
   * y luego convertimos a nombres.
   */
  const campaignOptions = country
    ? muralCampaigns
        .filter(
          (item) =>
            item.country === country,
        )
        .map((item) => item.name)
    : [];

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

    event.target.value = "";
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files ?? [],
    );

    if (files.length === 0) {
      return;
    }

    setAttachmentError("");

    const validFiles: File[] = [];

    for (const file of files) {
      const extension = `.${file.name
        .split(".")
        .pop()
        ?.toLowerCase()}`;

      const isValidType =
        ALLOWED_ATTACHMENT_TYPES.includes(
          file.type,
        ) ||
        ALLOWED_ATTACHMENT_EXTENSIONS.includes(
          extension,
        );

      if (!isValidType) {
        setAttachmentError(
          `El archivo "${file.name}" no es un tipo permitido.`,
        );

        continue;
      }

      if (file.size > MAX_ATTACHMENT_SIZE) {
        setAttachmentError(
          `El archivo "${file.name}" supera el límite de 10 MB.`,
        );

        continue;
      }

      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== "string") {
          return;
        }

        const newAttachment: PostAttachment = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result,
        };

        setAttachments((current) => [
          ...current,
          newAttachment,
        ]);
      };

      reader.onerror = () => {
        setAttachmentError(
          `No se pudo leer el archivo "${file.name}".`,
        );
      };

      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleRemoveAttachment = (
    attachmentId: string,
  ) => {
    setAttachments((current) =>
      current.filter(
        (attachment) =>
          attachment.id !== attachmentId,
      ),
    );
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const handleAudienceChange = (
    value: string,
  ) => {
    const audienceMap: Record<
      string,
      PostAudience
    > = {
      "Todos los empleados": "all",
      "Una campaña": "campaign",
      "Un área": "area",
      "Un país": "country",
    };

    const newAudience =
      audienceMap[value] ?? "all";

    setAudience(newAudience);

    setCountry("");
    setArea("");
    setCampaign("");

    closeAllSelects();
  };

  const handleCampaignChange = (
    value: string,
  ) => {
    setCampaign(value);
    setIsCampaignOpen(false);
  };

  const handleAreaChange = (
    value: string,
  ) => {
    setArea(value);
    setIsAreaOpen(false);
  };

  const handleCountryChange = (
    value: string,
  ) => {
    setCountry(value);

    if (audience === "campaign") {
      setCampaign("");
    }

    setIsCountryOpen(false);
    setIsCampaignOpen(false);
  };

  const toggleCampaignSelect = () => {
    setIsCampaignOpen((current) => !current);

    setIsAudienceOpen(false);
    setIsAreaOpen(false);
    setIsCountryOpen(false);
  };

  const toggleAreaSelect = () => {
    setIsAreaOpen((current) => !current);

    setIsAudienceOpen(false);
    setIsCampaignOpen(false);
    setIsCountryOpen(false);
  };

  const toggleCountrySelect = () => {
    setIsCountryOpen((current) => !current);

    setIsAudienceOpen(false);
    setIsCampaignOpen(false);
    setIsAreaOpen(false);
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    if (
      audience === "campaign" &&
      (!country || !campaign)
    ) {
      return;
    }

    if (
      audience === "area" &&
      !area
    ) {
      return;
    }

    if (
      audience === "country" &&
      !country
    ) {
      return;
    }

    const audienceValue =
      audience === "campaign"
        ? campaign
        : audience === "area"
          ? area
          : audience === "country"
            ? country
            : undefined;

    onCreatePost({
      title: title.trim(),
      content: content.trim(),
      audience,
      audienceValue,

      country:
        audience === "campaign" ||
        audience === "country"
          ? country || undefined
          : undefined,

      area:
        audience === "area"
          ? area || undefined
          : undefined,

      campaign:
        audience === "campaign"
          ? campaign || undefined
          : undefined,

      image:
        imagePreview || undefined,

      link:
        link.trim() || undefined,

      attachments,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setContent("");

    setAudience("all");

    setCountry("");
    setArea("");
    setCampaign("");

    setImageFile(null);
    setImagePreview("");

    setLink("");

    setAttachments([]);
    setAttachmentError("");

    closeAllSelects();

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
                  setTitle(
                    event.target.value,
                  )
                }
                placeholder="Escribe el título de la publicación"
                required
              />
            </label>

            <label>
              Contenido

              <textarea
                rows={5}
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value,
                  )
                }
                placeholder="Escribe el contenido que quieres compartir..."
                required
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

                  <button
                    type="button"
                    className="create-post-modal__remove-image"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    aria-label="Quitar imagen"
                    title="Quitar imagen"
                  >
                    <X size={16} />

                    <span>
                      Quitar imagen
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="create-post-modal__field">
              <span>
                Archivos adjuntos
              </span>

              <input
                id="post-attachments"
                type="file"
                multiple
                accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(
                  ",",
                )}
                onChange={
                  handleAttachmentChange
                }
                hidden
              />

              <label
                htmlFor="post-attachments"
                className="create-post-modal__upload"
              >
                <FileText size={18} />

                <span>
                  Seleccionar archivos
                </span>
              </label>

              <small>
                PDF, Word, Excel,
                PowerPoint, TXT o ZIP.
                Máximo 10 MB por archivo.
              </small>

              {attachmentError && (
                <p className="create-post-modal__error">
                  {attachmentError}
                </p>
              )}

              {attachments.length > 0 && (
                <div className="create-post-modal__attachments">
                  {attachments.map(
                    (attachment) => (
                      <div
                        key={attachment.id}
                        className="create-post-modal__attachment"
                      >
                        <FileText size={18} />

                        <div>
                          <strong>
                            {attachment.name}
                          </strong>

                          <span>
                            {formatFileSize(
                              attachment.size,
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="delete-postal__archive"
                          onClick={() =>
                            handleRemoveAttachment(
                              attachment.id,
                            )
                          }
                          aria-label={`Eliminar ${attachment.name}`}
                          title="Eliminar archivo"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <label>
              Enlace

              <input
                type="url"
                value={link}
                onChange={(event) =>
                  setLink(
                    event.target.value,
                  )
                }
                placeholder="https://ejemplo.com"
              />
            </label>

            <div className="create-post-modal__field">
              <span>
                Publicar para
              </span>

              <CustomSelect
                options={audienceOptions}
                value={
                  audienceLabels[audience]
                }
                placeholder="Selecciona una opción"
                isOpen={isAudienceOpen}
                onChange={
                  handleAudienceChange
                }
                onToggle={() =>
                  setIsAudienceOpen(
                    (current) => {
                      const next = !current;

                      if (next) {
                        setIsCampaignOpen(false);
                        setIsAreaOpen(false);
                        setIsCountryOpen(false);
                      }

                      return next;
                    },
                  )
                }
                onClose={() =>
                  setIsAudienceOpen(false)
                }
              />
            </div>

            {audience === "campaign" && (
              <>
                <div className="create-post-modal__field">
                  <span>País</span>

                  <CustomSelect
                    options={muralCountries}
                    value={country}
                    placeholder="Selecciona un país"
                    isOpen={isCountryOpen}
                    onChange={
                      handleCountryChange
                    }
                    onToggle={
                      toggleCountrySelect
                    }
                    onClose={() =>
                      setIsCountryOpen(false)
                    }
                  />
                </div>

                {country && (
                  <div className="create-post-modal__field">
                    <span>
                      Campaña
                    </span>

                    {campaignOptions.length > 0 ? (
                      <CustomSelect
                        options={
                          campaignOptions
                        }
                        value={campaign}
                        placeholder="Selecciona una campaña"
                        isOpen={
                          isCampaignOpen
                        }
                        onChange={
                          handleCampaignChange
                        }
                        onToggle={
                          toggleCampaignSelect
                        }
                        onClose={() =>
                          setIsCampaignOpen(
                            false,
                          )
                        }
                      />
                    ) : (
                      <small>
                        No hay campañas
                        configuradas para
                        este país todavía.
                      </small>
                    )}
                  </div>
                )}
              </>
            )}

            {audience === "area" && (
              <div className="create-post-modal__field">
                <span>Área</span>

                <CustomSelect
                  options={muralAreas}
                  value={area}
                  placeholder="Selecciona un área"
                  isOpen={isAreaOpen}
                  onChange={
                    handleAreaChange
                  }
                  onToggle={
                    toggleAreaSelect
                  }
                  onClose={() =>
                    setIsAreaOpen(false)
                  }
                />
              </div>
            )}

            {audience === "country" && (
              <div className="create-post-modal__field">
                <span>País</span>

                <CustomSelect
                  options={muralCountries}
                  value={country}
                  placeholder="Selecciona un país"
                  isOpen={isCountryOpen}
                  onChange={
                    handleCountryChange
                  }
                  onToggle={
                    toggleCountrySelect
                  }
                  onClose={() =>
                    setIsCountryOpen(false)
                  }
                />
              </div>
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