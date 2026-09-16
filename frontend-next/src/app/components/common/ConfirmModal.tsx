"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="confirm-modal__overlay"
      onClick={onCancel}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="confirm-modal__header">
          <div className="confirm-modal__icon">
            <AlertTriangle size={22} />
          </div>

          <button
            type="button"
            className="confirm-modal__close"
            onClick={onCancel}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="confirm-modal__body">
          <h2 id="confirm-modal-title">
            {title}
          </h2>

          <p>{message}</p>
        </div>

        <div className="confirm-modal__footer">
          <button
            type="button"
            className="confirm-modal__cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="confirm-modal__confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}