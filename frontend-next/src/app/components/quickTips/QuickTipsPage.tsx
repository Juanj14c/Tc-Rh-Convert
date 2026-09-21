"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import QuickTipModal from "@/components/quickTips/QuickTipModal";

import {
  initialQuickTips,
} from "@/data/quickTips";

import type { QuickTip } from "@/types/quickTips";

const STORAGE_KEY =
  "tc-rh-quick-tips";

function getStoredQuickTips() {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return initialQuickTips;
    }

    return JSON.parse(
      stored,
    ) as QuickTip[];
  } catch {
    return initialQuickTips;
  }
}

function getAudienceLabel(
  tip: QuickTip,
) {
  if (
    tip.audienceType === "all"
  ) {
    return "Todos";
  }

  if (
    tip.audienceType === "area"
  ) {
    return `Área → ${tip.audienceValue}`;
  }

  return `Campaña → ${tip.audienceValue}`;
}

function QuickTipsPage() {
  const [tips, setTips] =
    useState<QuickTip[]>([]);

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    editingTip,
    setEditingTip,
  ] = useState<QuickTip | null>(
    null,
  );

  useEffect(() => {
    setTips(getStoredQuickTips());
  }, []);

  const persistTips = (
    nextTips: QuickTip[],
  ) => {
    setTips(nextTips);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextTips),
    );
  };

  const handleCreate = () => {
    setEditingTip(null);
    setIsModalOpen(true);
  };

  const handleEdit = (
    tip: QuickTip,
  ) => {
    setEditingTip(tip);
    setIsModalOpen(true);
  };

  const handleSave = (
    data: Omit<
      QuickTip,
      "id" | "createdAt"
    >,
  ) => {
    if (editingTip) {
      const nextTips =
        tips.map((tip) =>
          tip.id ===
          editingTip.id
            ? {
                ...tip,
                ...data,
              }
            : tip,
        );

      persistTips(nextTips);
    } else {
      const newTip: QuickTip = {
        id: Date.now(),
        createdAt:
          new Date().toISOString(),
        ...data,
      };

      persistTips([
        newTip,
        ...tips,
      ]);
    }

    setIsModalOpen(false);
    setEditingTip(null);
  };

  const handleToggle = (
    tipId: number,
  ) => {
    const nextTips =
      tips.map((tip) =>
        tip.id === tipId
          ? {
              ...tip,
              active: !tip.active,
            }
          : tip,
      );

    persistTips(nextTips);
  };

  const handleDelete = (
    tipId: number,
  ) => {
    const confirmed =
      window.confirm(
        "¿Quieres eliminar este consejo?",
      );

    if (!confirmed) {
      return;
    }

    const nextTips =
      tips.filter(
        (tip) => tip.id !== tipId,
      );

    persistTips(nextTips);
  };

  return (
    <section className="quick-tips-page">
      <div className="quick-tips-page__header">
        <div>
          <span className="quick-tips-page__eyebrow">
            Talento & Cultura
          </span>

          <h1>
            Consejos rápidos
          </h1>

          <p>
            Crea mensajes breves para
            compartir con los
            colaboradores según su
            área o campaña.
          </p>
        </div>

        <button
          type="button"
          className="quick-tips-page__primary-button"
          onClick={handleCreate}
        >
          <Plus size={18} />
          Nuevo consejo
        </button>
      </div>

      <div className="quick-tips-page__card">
        {tips.length === 0 ? (
          <div className="quick-tips-page__empty">
            <Lightbulb size={28} />

            <h3>
              Aún no hay consejos
            </h3>

            <p>
              Crea el primero para
              empezar a compartir
              recomendaciones.
            </p>
          </div>
        ) : (
          <div className="quick-tips-page__list">
            {tips.map((tip) => (
              <article
                key={tip.id}
                className={`quick-tip-card ${
                  tip.active
                    ? ""
                    : "quick-tip-card--inactive"
                }`}
              >
                <div className="quick-tip-card__icon">
                  <Lightbulb
                    size={20}
                  />
                </div>

                <div className="quick-tip-card__content">
                  <div className="quick-tip-card__top">
                    <div>
                      <span className="quick-tip-card__audience">
                        {getAudienceLabel(
                          tip,
                        )}
                      </span>

                      <h3>
                        {tip.title}
                      </h3>
                    </div>

                    <span
                      className={`quick-tip-card__status ${
                        tip.active
                          ? "quick-tip-card__status--active"
                          : "quick-tip-card__status--inactive"
                      }`}
                    >
                      {tip.active
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                  </div>

                  <p>
                    {tip.message}
                  </p>

                  <div className="quick-tip-card__actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(
                          tip,
                        )
                      }
                      title="Editar consejo"
                    >
                      <Pencil
                        size={15}
                      />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggle(
                          tip.id,
                        )
                      }
                      title={
                        tip.active
                          ? "Desactivar consejo"
                          : "Activar consejo"
                      }
                    >
                      <Power
                        size={15}
                      />
                      {tip.active
                        ? "Desactivar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          tip.id,
                        )
                      }
                      title="Eliminar consejo"
                    >
                      <Trash2
                        size={15}
                      />
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <QuickTipModal
        isOpen={isModalOpen}
        tip={editingTip}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTip(null);
        }}
        onSave={handleSave}
      />
    </section>
  );
}

export default QuickTipsPage;