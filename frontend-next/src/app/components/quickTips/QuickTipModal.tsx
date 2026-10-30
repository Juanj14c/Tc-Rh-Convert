
"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";

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

interface EmployeeAudienceOption {
  country: string;
  area: string;
  campaign: string;
  employeeType: "planta" | "campana";
}

interface AudienceOptionsResponse {
  options?: EmployeeAudienceOption[];
  error?: string;
}

function normalizeMatch(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

function uniqueSorted(values: string[]): string[] {
  const unique = new Map<string, string>();

  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ");

    if (!clean) {
      continue;
    }

    const key = normalizeMatch(clean);

    if (!unique.has(key)) {
      unique.set(key, clean);
    }
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.localeCompare(b, "es", {
      sensitivity: "base",
    }),
  );
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
    useState(() => tip?.audienceValue ?? "");

  const [audienceCountry, setAudienceCountry] =
    useState(() => tip?.audienceCountry ?? "");

  const [employeeOptions, setEmployeeOptions] =
    useState<EmployeeAudienceOption[]>([]);

  const [
    isLoadingAudienceOptions,
    setIsLoadingAudienceOptions,
  ] = useState(false);

  const [
    audienceOptionsError,
    setAudienceOptionsError,
  ] = useState("");

  const [generationTopic, setGenerationTopic] =
    useState("");

  const [isGeneratingDraft, setIsGeneratingDraft] =
    useState(false);

  const [generationError, setGenerationError] =
    useState("");

  const [error, setError] = useState("");
  const [openSelect, setOpenSelect] = useState("");

  const isEditing = Boolean(tip);

  /*
   * Cargar las opciones reales desde empleados activos.
   * No usamos listas fijas para países, campañas ni áreas.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadAudienceOptions() {
      setIsLoadingAudienceOptions(true);
      setAudienceOptionsError("");

      try {
        const response = await fetch(
          "/api/quick-tips/options",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json().catch(() => null)) as
            | AudienceOptionsResponse
            | null;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "No se pudieron cargar los países, áreas y campañas.",
          );
        }

        if (!result || !Array.isArray(result.options)) {
          throw new Error(
            "La respuesta de opciones no tiene un formato válido.",
          );
        }

        if (!cancelled) {
          setEmployeeOptions(result.options);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "[Consejos] Error cargando opciones de audiencia:",
            error,
          );

          setAudienceOptionsError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las opciones de audiencia.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAudienceOptions(false);
        }
      }
    }

    void loadAudienceOptions();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /*
   * Obtener países únicos y filtrar las opciones
   * por el país seleccionado.
   */
  const countries = uniqueSorted(
    employeeOptions.map((option) => option.country),
  );

  const optionsForCountry = employeeOptions.filter(
    (option) =>
      normalizeMatch(option.country) ===
      normalizeMatch(audienceCountry),
  );

  const areaOptions = uniqueSorted(
    optionsForCountry
      .filter(
        (option) => option.employeeType === "planta",
      )
      .map((option) => option.area),
  );

  const campaignOptions = uniqueSorted(
    optionsForCountry
      .filter(
        (option) => option.employeeType === "campana",
      )
      .map((option) => option.campaign),
  );

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

    if (nextType === "all") {
      setAudienceCountry("");
    }

    setError("");
    setGenerationError("");
    setOpenSelect("");
  };

  const handleAudienceCountryChange = (
    value: string,
  ) => {
    setAudienceCountry(value);
    setAudienceValue("");
    setError("");
    setGenerationError("");
    setOpenSelect("");
  };

  const handleAudienceValueChange = (
    value: string,
  ) => {
    setAudienceValue(value);
    setError("");
    setGenerationError("");
    setOpenSelect("");
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

  /*
   * Solicitar a OlivIA un borrador.
   * La API solo devuelve el borrador; no lo publica.
   */
  const handleGenerateDraft = async () => {
    if (isGeneratingDraft) {
      return;
    }

    const cleanCountry = audienceCountry.trim();
    const cleanAudienceValue = audienceValue.trim();

    if (
      audienceType !== "all" &&
      !cleanCountry
    ) {
      setGenerationError(
        "Selecciona el país de destino antes de generar el consejo.",
      );
      return;
    }

    if (
      audienceType !== "all" &&
      !cleanAudienceValue
    ) {
      setGenerationError(
        audienceType === "area"
          ? "Selecciona un área antes de generar el consejo."
          : "Selecciona una campaña antes de generar el consejo.",
      );
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
            audienceCountry:
              audienceType === "all"
                ? ""
                : cleanCountry,
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

  /*
   * Validar y enviar el consejo al componente padre.
   */
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanAudienceValue = audienceValue.trim();
    const cleanAudienceCountry = audienceCountry.trim();

    if (!cleanTitle) {
      setError("El título es obligatorio.");
      return;
    }

    if (!cleanMessage) {
      setError("El mensaje es obligatorio.");
      return;
    }

    if (audienceType !== "all") {
      if (!cleanAudienceCountry) {
        setError("Selecciona el país de destino.");
        return;
      }

      const validCountry = countries.some(
        (country) =>
          normalizeMatch(country) ===
          normalizeMatch(cleanAudienceCountry),
      );

      if (!validCountry) {
        setError(
          "El país seleccionado ya no está disponible. Elige uno de la lista.",
        );
        return;
      }

      if (!cleanAudienceValue) {
        setError(
          audienceType === "area"
            ? "Selecciona un área para publicar el consejo."
            : "Selecciona una campaña para publicar el consejo.",
        );
        return;
      }

      const validOptions =
        audienceType === "area"
          ? areaOptions
          : campaignOptions;

      const validAudience = validOptions.some(
        (option) =>
          normalizeMatch(option) ===
          normalizeMatch(cleanAudienceValue),
      );

      if (!validAudience) {
        setError(
          audienceType === "area"
            ? "Selecciona un área válida para el país elegido."
            : "Selecciona una campaña válida para el país elegido.",
        );
        return;
      }
    }

    onSave({
      title: cleanTitle,
      message: cleanMessage,
      audienceType,
      audienceValue:
        audienceType === "all"
          ? ""
          : cleanAudienceValue,
      audienceCountry:
        audienceType === "all"
          ? ""
          : cleanAudienceCountry,
      active: tip?.active ?? true,
    });
  };

  const audienceLabel =
    audienceType === "all"
      ? "Todos"
      : audienceType === "area"
        ? "Área"
        : "Campaña";

  const audienceOptionsReady =
    !isLoadingAudienceOptions &&
    !audienceOptionsError;

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
            <span>Tema para OlivIA (opcional)</span>

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
            disabled={
              isGeneratingDraft ||
              (audienceType !== "all" &&
                !audienceOptionsReady)
            }
          >
            {isGeneratingDraft ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
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

          {/* ESTADO DE CARGA DE OPCIONES */}

          {isLoadingAudienceOptions && (
            <p role="status">
              Cargando países, áreas y campañas...
            </p>
          )}

          {audienceOptionsError && (
            <div
              className="quick-tip-modal__error"
              role="alert"
            >
              {audienceOptionsError}
            </div>
          )}

          {/* PAÍS */}

          {audienceType !== "all" && (
            <div className="quick-tip-modal__field">
              <span>País de trabajo</span>

              <CustomSelect
                options={countries}
                value={audienceCountry}
                placeholder="Selecciona un país"
                isOpen={openSelect === "country"}
                onChange={handleAudienceCountryChange}
                onToggle={() =>
                  toggleSelect("country")
                }
                onClose={() => setOpenSelect("")}
              />
            </div>
          )}

          {/* ÁREA */}

          {audienceType === "area" &&
            audienceCountry && (
              <div className="quick-tip-modal__field">
                <span>Área</span>

                <CustomSelect
                  options={areaOptions}
                  value={audienceValue}
                  placeholder="Selecciona un área"
                  isOpen={openSelect === "area"}
                  onChange={handleAudienceValueChange}
                  onToggle={() =>
                    toggleSelect("area")
                  }
                  onClose={() => setOpenSelect("")}
                />

                {audienceOptionsReady &&
                  areaOptions.length === 0 && (
                    <p>
                      No hay áreas activas registradas
                      para este país.
                    </p>
                  )}
              </div>
            )}

          {/* CAMPAÑA */}

          {audienceType === "campaign" &&
            audienceCountry && (
              <div className="quick-tip-modal__field">
                <span>Campaña</span>

                <CustomSelect
                  options={campaignOptions}
                  value={audienceValue}
                  placeholder="Selecciona una campaña"
                  isOpen={openSelect === "campaign"}
                  onChange={handleAudienceValueChange}
                  onToggle={() =>
                    toggleSelect("campaign")
                  }
                  onClose={() => setOpenSelect("")}
                />

                {audienceOptionsReady &&
                  campaignOptions.length === 0 && (
                    <p>
                      No hay campañas activas registradas
                      para este país.
                    </p>
                  )}
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
