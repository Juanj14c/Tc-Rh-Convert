
"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Lightbulb,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";


import QuickTipModal from "@/components/quickTips/QuickTipModal";
import { useProfile } from "@/hooks/useProfile";

import type { QuickTip } from "@/types/quickTips";

const STORAGE_KEY = "tc-rh-quick-tips";

interface TipsResponse {
  tips?: QuickTip[];
  error?: string;
}

interface TipResponse {
  tip?: QuickTip;
  error?: string;
}

interface DeleteResponse {
  success?: boolean;
  error?: string;
}

function getAudienceLabel(tip: QuickTip) {
  if (tip.audienceType === "all") {
    return "Todos";
  }

  if (tip.audienceType === "area") {
    return `Área → ${tip.audienceValue}`;
  }

  return `Campaña → ${tip.audienceValue}`;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function QuickTipsPage() {
  const {
    isAdmin,
    isProfileLoading,
  } = useProfile();

  const [tips, setTips] = useState<QuickTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingTip, setEditingTip] =
    useState<QuickTip | null>(null);

  /*
   * Cargar consejos desde la API.
   * La API decide qué consejos puede ver
   * cada usuario según su sesión.
   */
  const loadTips = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/quick-tips", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        await readJson<TipsResponse>(response);

      if (!response.ok) {
        throw new Error(
          result.error || "No se pudieron cargar los consejos.",
        );
      }

      setTips(result.tips ?? []);
    } catch (error) {
      console.error(
        "[Consejos] Error cargando la lista:",
        error,
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los consejos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    const timer = window.setTimeout(()=>{
      void loadTips();
    }, 0);

    return () =>{
      window.clearTimeout(timer);
    };
  },[isProfileLoading, loadTips]);


  /*
   * Crear o editar un consejo.
   */
  const handleSave = async (
    data: Omit<QuickTip, "id" | "createdAt">,
  ) => {
    if (!isAdmin || isSaving) {
      return;
    }

    setIsSaving(true);
    setLoadError("");

    try {
      const isEditing = editingTip !== null;

      const response = await fetch("/api/quick-tips", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(
          isEditing
            ? {
                id: editingTip.id,
                tip: data,
              }
            : {
                tip: data,
              },
        ),
      });

      const result =
        await readJson<TipResponse>(response);

      if (!response.ok || !result.tip) {
        throw new Error(
          result.error || "No se pudo guardar el consejo.",
        );
      }

      setTips((current) =>
        isEditing
          ? current.map((tip) =>
              tip.id === result.tip!.id
                ? result.tip!
                : tip,
            )
          : [result.tip!, ...current],
      );

      setIsModalOpen(false);
      setEditingTip(null);
    } catch (error) {
      console.error(
        "[Consejos] Error guardando:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el consejo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Activar o desactivar un consejo.
   */
  const handleToggle = async (tip: QuickTip) => {
    if (!isAdmin || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/quick-tips", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          id: tip.id,
          active: !tip.active,
        }),
      });

      const result =
        await readJson<TipResponse>(response);

      if (!response.ok || !result.tip) {
        throw new Error(
          result.error || "No se pudo cambiar el estado.",
        );
      }

      setTips((current) =>
        current.map((item) =>
          item.id === result.tip!.id
            ? result.tip!
            : item,
        ),
      );
    } catch (error) {
      console.error(
        "[Consejos] Error cambiando el estado:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del consejo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Eliminar un consejo.
   */
  const handleDelete = async (tip: QuickTip) => {
    if (!isAdmin || isSaving) {
      return;
    }

    const confirmed = window.confirm(
      "¿Quieres eliminar este consejo permanentemente?",
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/quick-tips", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          id: tip.id,
        }),
      });

      const result =
        await readJson<DeleteResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No se pudo eliminar el consejo.",
        );
      }

      setTips((current) =>
        current.filter((item) => item.id !== tip.id),
      );

      if (editingTip?.id === tip.id) {
        setIsModalOpen(false);
        setEditingTip(null);
      }
    } catch (error) {
      console.error(
        "[Consejos] Error eliminando:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el consejo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    if (!isAdmin || isSaving) {
      return;
    }

    setEditingTip(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tip: QuickTip) => {
    if (!isAdmin || isSaving) {
      return;
    }

    setEditingTip(tip);
    setIsModalOpen(true);
  };

  /*
   * Estado de carga de la sesión.
   */
  if (isProfileLoading) {
    return (
      <section className="quick-tips-page">
        <div className="quick-tips-page__empty">
          <p>Cargando tu perfil...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="quick-tips-page">
      {/* ENCABEZADO */}

      <div className="quick-tips-page__header">
        <div>
          <span className="quick-tips-page__eyebrow">
            Talento & Cultura
          </span>

          <h1>Consejos rápidos</h1>

          <p>
            {isAdmin
              ? "Crea y administra consejos para compartirlos con los colaboradores según su área o campaña."
              : "Consulta las recomendaciones disponibles para ti."}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="quick-tips-page__primary-button"
            onClick={handleCreate}
            disabled={isSaving}
          >
            <Plus size={18} />
            Nuevo consejo
          </button>
        )}
      </div>

      {/* LISTA */}

      <div className="quick-tips-page__card">
        {isLoading ? (
          <div className="quick-tips-page__empty">
            <Lightbulb size={28} />
            <h3>Cargando consejos</h3>
            <p>Estamos consultando la información guardada.</p>
          </div>
        ) : loadError ? (
          <div className="quick-tips-page__empty">
            <Lightbulb size={28} />

            <h3>No se pudieron cargar los consejos</h3>

            <p>{loadError}</p>

            <button
              type="button"
              className="quick-tips-page__primary-button"
              onClick={() => void loadTips()}
            >
              Reintentar
            </button>
          </div>
        ) : tips.length === 0 ? (
          <div className="quick-tips-page__empty">
            <Lightbulb size={28} />

            <h3>
              {isAdmin
                ? "Aún no hay consejos"
                : "No hay consejos disponibles"}
            </h3>

            <p>
              {isAdmin
                ? "Crea el primer consejo para compartir recomendaciones con los colaboradores."
                : "Cuando haya consejos activos para tu público, aparecerán aquí."}
            </p>

            {isAdmin && (
              <button
                type="button"
                className="quick-tips-page__primary-button"
                onClick={handleCreate}
                disabled={isSaving}
              >
                <Plus size={18} />
                Crear primer consejo
              </button>
            )}
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
                  <Lightbulb size={20} />
                </div>

                <div className="quick-tip-card__content">
                  <div className="quick-tip-card__top">
                    <div>
                      <span className="quick-tip-card__audience">
                        {getAudienceLabel(tip)}
                      </span>

                      <h3>{tip.title}</h3>
                    </div>

                    {isAdmin && (
                      <span
                        className={`quick-tip-card__status ${
                          tip.active
                            ? "quick-tip-card__status--active"
                            : "quick-tip-card__status--inactive"
                        }`}
                      >
                        {tip.active ? "Activo" : "Inactivo"}
                      </span>
                    )}
                  </div>

                  <p>{tip.message}</p>

                  {isAdmin && (
                    <div className="quick-tip-card__actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(tip)}
                        disabled={isSaving}
                        title="Editar consejo"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleToggle(tip)}
                        disabled={isSaving}
                        title={
                          tip.active
                            ? "Desactivar consejo"
                            : "Activar consejo"
                        }
                      >
                        <Power size={15} />
                        {tip.active ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(tip)}
                        disabled={isSaving}
                        title="Eliminar consejo"
                      >
                        <Trash2 size={15} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ADMINISTRATIVO */}

      {isAdmin && isModalOpen && (
        <QuickTipModal
        key={editingTip ?`edit-${editingTip.id}`: "new"}
          isOpen={true}
          tip={editingTip}
          onClose={() => {
            if (isSaving) {
              return;
            }

            setIsModalOpen(false);
            setEditingTip(null);
          }}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

export default QuickTipsPage;
