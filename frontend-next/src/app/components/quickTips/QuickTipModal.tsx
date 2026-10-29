"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";

import {sileo} from "sileo";
import {
  quickTipAreas,
  quickTipCampaigns,
} from "@/data/quickTips";

import type {
  QuickTip,
  QuickTipAudience,
} from "@/types/quickTips";

interface QuickTipModalProps {
  isOpen: boolean;
  tip?: QuickTip | null;
  onClose: () => void;
  onSave: (
    tip: Omit<QuickTip, "id" | "createdAt">,
  ) => void;
}

interface GenerateDraftResponse {
  draft?: {
    title?: string;
    message?: string;
  };
  error?: string;
}

function QuickTipModal({
  isOpen,
  tip = null,
  onClose,
  onSave,
}: QuickTipModalProps) {
  const [title, setTitle] = useState(
    () => tip?.title ?? "",
  );

  const [message, setMessage] = useState(
    () => tip?.message ?? "",
  );

  const [audienceType, setAudienceType] =
    useState<QuickTipAudience>(
      () => tip?.audienceType ?? "all",
    );

  const [audienceValue, setAudienceValue] =
    useState(
      () => tip?.audienceValue ?? "",
    );

  const [generationTopic, setGenerationTopic] =
    useState("");

  const [isGeneratingDraft, setIsGeneratingDraft] =
    useState(false);

  const [generationError, setGenerationError] =
    useState("");

  const [error, setError] = useState("");
  const [openSelect, setOpenSelect] = useState("");

  const isEditing = Boolean(tip);

  if (!isOpen) {
    return null;
  }

  const handleAudienceTypeChange = (
    value: string,
  ) => {
    let nextType: QuickTipAudience;

    switch (value.trim().toLocaleLowerCase("es")) {
      case "todos":
      case "all":
        nextType = "all";
        break;

      case "área":
      case "area":
        nextType = "area";
        break;

      case "campaña":
      case "campaign":
        nextType = "campaign";
        break;

      default:
        setError("Selecciona un público válido.");
        return;
    }

    setAudienceType(nextType);
    setAudienceValue("");
    setError("");
    setOpenSelect("");
  };

  const handleAudienceValueChange = (
    value: string,
  ) => {
    setAudienceValue(value);
    setError("");
    setOpenSelect("");
  };

  /*
   * Solicita a nuestro backend un borrador de OlivIA.
   * El backend protege la API key y verifica los permisos.
   * Aquí únicamente recibimos el contenido y lo mostramos
   * en el formulario, sin guardarlo en Supabase.
   */
  const handleGenerateDraft = async () => {
    if (isGeneratingDraft) {
      return;
    }

    setIsGeneratingDraft(true);
    setGenerationError("");
    setError("");

    try {
      const response = await fetch(
        "/api/quick-tips/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            topic:
              generationTopic.trim() ||
              title.trim(),
            audienceType,
            audienceValue,
          }),
        },
      );

      const result =
        (await response.json().catch(() => null)) as
          | GenerateDraftResponse
          | null;

      if (
        !response.ok ||
        !result?.draft ||
        typeof result.draft.title !== "string" ||
        typeof result.draft.message !== "string"
      ) {
        throw new Error(
          result?.error ||
            "No se pudo generar el borrador con OlivIA.",
        );
      }

      const generatedTitle =
        result.draft.title.trim();

      const generatedMessage =
        result.draft.message.trim();

      if (!generatedTitle || !generatedMessage) {
        throw new Error(
          "OlivIA no devolvió un título y un consejo completos. Inténtalo nuevamente.",
        );
      }

      setTitle(generatedTitle);
      setMessage(generatedMessage);
      setGenerationError("");
    } catch (error) {
      console.error(
        "[Consejos] Error generando borrador con OlivIA:",
        error,
      );

      setGenerationError(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con OlivIA.",
      );
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanAudienceValue = audienceValue.trim();

    if (!cleanTitle) {
      setError("El título es obligatorio.");
      return;
    }

    if (!cleanMessage) {
      setError("El mensaje es obligatorio.");
      return;
    }

    if (
      audienceType !== "all" &&
      !cleanAudienceValue
    ) {
      setError(
        audienceType === "area"
          ? "Selecciona un área para publicar el consejo."
          : "Selecciona una campaña para publicar el consejo.",
      );
      return;
    }

    onSave({
      title: cleanTitle,
      message: cleanMessage,
      audienceType,
      audienceValue:
        audienceType === "all"
          ? ""
          : cleanAudienceValue,
      active: tip?.active ?? true,
    });
  };

  const toggleSelect = (
    selectName: string,
  ) => {
    setOpenSelect((current) =>
      current === selectName
        ? ""
        : selectName,
    );
  };

  const audienceLabel =
    audienceType === "all"
      ? "Todos"
      : audienceType === "area"
        ? "Área"
        : "Campaña";

  return (
    <div
      className="quick-tip-modal__overlay"
      onClick={() => {
        if (!isGeneratingDraft) {
          onClose();
        }
      }}
    >
      <div
        className="quick-tip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-tip-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ENCABEZADO */}

        <div className="quick-tip-modal__header">
          <div>
            <span>Talento &amp; Cultura</span>

            <h2 id="quick-tip-modal-title">
              {isEditing
                ? "Editar consejo"
                : "Nuevo consejo"}
            </h2>
          </div>

          <button
            type="button"
            className="quick-tip-modal__close"
            onClick={onClose}
            disabled={isGeneratingDraft}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="quick-tip-modal__form"
          onSubmit={handleSubmit}
        >
          {/* TÍTULO */}

          <label className="quick-tip-modal__field">
            <span>Título</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Ej. Consejo de trabajo en equipo"
              maxLength={120}
              required
              disabled={isGeneratingDraft}
            />
          </label>

          {/* GENERACIÓN CON OLIVIA */}

          <label className="quick-tip-modal__field">
            <span>
              Tema para OlivIA (opcional)
            </span>

            <input
              type="text"
              value={generationTopic}
              onChange={(event) =>
                setGenerationTopic(event.target.value)
              }
              placeholder="Ej. comunicación, bienestar, colaboración..."
              maxLength={250}
              disabled={isGeneratingDraft}
            />
          </label>

          <button
            type="button"
            className="quick-tip-modal__save"
            onClick={() => void handleGenerateDraft()}
            disabled={isGeneratingDraft}
          >
            {isGeneratingDraft ? (
              <Loader2 size={17} />
            ) : (
              <Sparkles size={17} />
            )}

            {isGeneratingDraft
              ? "Generando borrador..."
              : "Generar borrador con OlivIA"}
          </button>

          {generationError && (
            <div
              className="quick-tip-modal__error"
              role="alert"
            >
              {generationError}
            </div>
          )}

          {/* MENSAJE */}

          <label className="quick-tip-modal__field">
            <span>Consejo</span>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Escribe o genera el consejo que quieres mostrar..."
              rows={4}
              required
              disabled={isGeneratingDraft}
            />
          </label>

          {/* PÚBLICO OBJETIVO */}

          <div className="quick-tip-modal__field">
            <span>Mostrar a</span>

            <CustomSelect
              options={[
                "Todos",
                "Área",
                "Campaña",
              ]}
              value={audienceLabel}
              placeholder="Selecciona el público"
              isOpen={openSelect === "audience"}
              onChange={handleAudienceTypeChange}
              onToggle={() =>
                toggleSelect("audience")
              }
              onClose={() => setOpenSelect("")}
            />
          </div>

          {/* ÁREA */}

          {audienceType === "area" && (
            <div className="quick-tip-modal__field">
              <span>Área</span>

              <CustomSelect
                options={quickTipAreas}
                value={audienceValue}
                placeholder="Selecciona un área"
                isOpen={openSelect === "area"}
                onChange={handleAudienceValueChange}
                onToggle={() =>
                  toggleSelect("area")
                }
                onClose={() => setOpenSelect("")}
              />
            </div>
          )}

          {/* CAMPAÑA */}

          {audienceType === "campaign" && (
            <div className="quick-tip-modal__field">
              <span>Campaña</span>

              <CustomSelect
                options={quickTipCampaigns}
                value={audienceValue}
                placeholder="Selecciona una campaña"
                isOpen={openSelect === "campaign"}
                onChange={handleAudienceValueChange}
                onToggle={() =>
                  toggleSelect("campaign")
                }
                onClose={() => setOpenSelect("")}
              />
            </div>
          )}

          {/* VALIDACIÓN */}

          {error && (
            <div
              className="quick-tip-modal__error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* ACCIONES */}

          <div className="quick-tip-modal__footer">
            <button
              type="button"
              className="quick-tip-modal__cancel"
              onClick={onClose}
              disabled={isGeneratingDraft}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="quick-tip-modal__save"
              disabled={isGeneratingDraft}
            >
              {isEditing
                ? "Guardar cambios"
                : "Crear consejo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickTipModal;