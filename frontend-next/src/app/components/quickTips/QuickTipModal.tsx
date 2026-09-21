"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/common/CustomSelect";

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

function QuickTipModal({
  isOpen,
  tip = null,
  onClose,
  onSave,
}: QuickTipModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] =
    useState<QuickTipAudience>("all");
  const [audienceValue, setAudienceValue] =
    useState("");
  const [error, setError] = useState("");

  const [openSelect, setOpenSelect] =
    useState("");

  const isEditing = Boolean(tip);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(tip?.title ?? "");
    setMessage(tip?.message ?? "");
    setAudienceType(
      tip?.audienceType ?? "all",
    );
    setAudienceValue(
      tip?.audienceValue ?? "",
    );
    setError("");
    setOpenSelect("");
  }, [isOpen, tip]);

  if (!isOpen) {
    return null;
  }

  const handleAudienceTypeChange = (
    value: string,
  ) => {
    const nextType =
      value as QuickTipAudience;

    setAudienceType(nextType);
    setAudienceValue("");
    setOpenSelect("");
  };

  const handleAudienceValueChange = (
    value: string,
  ) => {
    setAudienceValue(value);
    setOpenSelect("");
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanAudienceValue =
      audienceValue.trim();

    if (!cleanTitle) {
      setError(
        "El título es obligatorio.",
      );
      return;
    }

    if (!cleanMessage) {
      setError(
        "El mensaje es obligatorio.",
      );
      return;
    }

    if (
      audienceType !== "all" &&
      !cleanAudienceValue
    ) {
      setError(
        "Selecciona el público objetivo.",
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

  return (
    <div
      className="quick-tip-modal__overlay"
      onClick={onClose}
    >
      <div
        className="quick-tip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-tip-modal-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="quick-tip-modal__header">
          <div>
            <span>
              Talento & Cultura
            </span>

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
          <label className="quick-tip-modal__field">
            <span>Título</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Ej. Consejo de campaña"
            />
          </label>

          <label className="quick-tip-modal__field">
            <span>Consejo</span>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder="Escribe el consejo que quieres mostrar..."
              rows={4}
            />
          </label>

          <div className="quick-tip-modal__field">
            <span>Mostrar a</span>

            <CustomSelect
              options={[
                "Todos",
                "Área",
                "Campaña",
              ]}
              value={
                audienceType === "all"
                  ? "Todos"
                  : audienceType === "area"
                    ? "Área"
                    : "Campaña"
              }
              placeholder="Selecciona el público"
              isOpen={
                openSelect ===
                "audience"
              }
              onChange={
                handleAudienceTypeChange
              }
              onToggle={() =>
                toggleSelect(
                  "audience",
                )
              }
              onClose={() =>
                setOpenSelect("")
              }
            />
          </div>

          {audienceType === "area" && (
            <div className="quick-tip-modal__field">
              <span>Área</span>

              <CustomSelect
                options={quickTipAreas}
                value={audienceValue}
                placeholder="Selecciona un área"
                isOpen={
                  openSelect === "area"
                }
                onChange={
                  handleAudienceValueChange
                }
                onToggle={() =>
                  toggleSelect(
                    "area",
                  )
                }
                onClose={() =>
                  setOpenSelect("")
                }
              />
            </div>
          )}

          {audienceType ===
            "campaign" && (
            <div className="quick-tip-modal__field">
              <span>Campaña</span>

              <CustomSelect
                options={
                  quickTipCampaigns
                }
                value={audienceValue}
                placeholder="Selecciona una campaña"
                isOpen={
                  openSelect ===
                  "campaign"
                }
                onChange={
                  handleAudienceValueChange
                }
                onToggle={() =>
                  toggleSelect(
                    "campaign",
                  )
                }
                onClose={() =>
                  setOpenSelect("")
                }
              />
            </div>
          )}

          {error && (
            <div
              className="quick-tip-modal__error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="quick-tip-modal__footer">
            <button
              type="button"
              className="quick-tip-modal__cancel"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="quick-tip-modal__save"
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