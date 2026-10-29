"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import CreatePostModal from "@/components/mural/CreatePostModal";
import PostCard from "@/components/mural/PostCard";
import ConfirmModal from "@/components/common/ConfirmModal";
import CustomSelect from "@/components/common/CustomSelect";

import { useTheme } from "@/contexts/useTheme";
import { useSearch } from "@/contexts/SearchContext";

import type {
  Post,
  NewPost,
  PostReaction,
  MuralCampaign,
} from "@/types/mural";

import { sileo, type SileoOptions } from "sileo";
import { useProfile } from "@/hooks/useProfile";
import type { QuickTip } from "@/types/quickTips";

interface QuickTipsResponse {
  tips?: QuickTip[];
  error?: string;
}

interface MuralPostsResponse {
  posts?: Post[];
  error?: string;
}

interface MuralPostResponse {
  post?: Post;
  error?: string;
}

interface MuralReactionResponse {
  reaction?: PostReaction;
  likes?: number;
  dislikes?: number;
  error?: string;
}

interface MuralOptionsResponse {
  countries?: string[];
  areas?: string[];
  campaigns?: MuralCampaign[];
  error?: string;
}

function normalizeAudienceValue(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function uniquePostOptions(values: Array<string | null | undefined>): string[] {
  const options = new Map<string, string>();
  for (const value of values) {
    const label = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
    const key = normalizeAudienceValue(label);
    if (key && !options.has(key)) options.set(key, label);
  }
  return [...options.values()].sort((a, b) => a.localeCompare(b, "es"));
}

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function matchesQuickTipAudience(
  tip: QuickTip,
  area: string,
  campaign: string,
  employeeType: string,
): boolean {
  if (!tip.active) {
    return false;
  }

  if (tip.audienceType === "all") {
    return true;
  }

  if (tip.audienceType === "area") {
    return (
      employeeType !== "campana" &&
      Boolean(normalizeAudienceValue(area)) &&
      normalizeAudienceValue(tip.audienceValue) ===
        normalizeAudienceValue(area)
    );
  }

  if (tip.audienceType === "campaign") {
    return (
      Boolean(normalizeAudienceValue(campaign)) &&
      normalizeAudienceValue(tip.audienceValue) ===
        normalizeAudienceValue(campaign)
    );
  }

  return false;
}

export default function MuralPage() {
  const { isDarkMode } = useTheme();
  const { profile, isProfileLoading, isAdmin } = useProfile();

  const {
    searchTerm,
    setSearchTerm,
  } = useSearch();

  // Leemos las propiedades de perfil usadas para asignar el público.
  // El cast evita acoplar el Mural a campos opcionales que pueden no existir
  // en perfiles antiguos; solo se utilizan cadenas cuando están disponibles.
  const profileData = (profile ?? {}) as unknown as Record<string, unknown>;
  const profileId =
    typeof profileData.id === "string" ? profileData.id : "";
  const profileName =
    typeof profileData.name === "string" ? profileData.name : "";
  const profileArea =
    typeof profileData.area === "string" ? profileData.area : "";
  const profileCampaign =
    typeof profileData.campaign === "string" ? profileData.campaign : "";
  const profileEmployeeType =
    typeof profileData.employeeType === "string"
      ? profileData.employeeType.toLocaleLowerCase("es")
      : "";

  /*
   * CONSEJOS EMERGENTES DEL MURAL
   *
   * Consulta los consejos activos, respeta el público configurado y los muestra
   * en orden aleatorio. Cuando todos hayan aparecido, comienza un nuevo ciclo
   * con otro orden para que los consejos puedan repetirse sin crear otros nuevos.
   */
  useEffect(() => {
    if (isProfileLoading) {
      return;
    }

    let cancelled = false;
    let timerId: number | undefined;
    // El Toaster vive en el layout global, así que cerramos el consejo activo
    // explícitamente cuando el usuario sale del Mural.
    let activeToastId: string | undefined;

    const showQuickTips = async () => {
      try {
        const response = await fetch("/api/quick-tips", {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as
          | QuickTipsResponse
          | null;

        if (!response.ok) {
          throw new Error(
            result?.error || "No se pudieron consultar los consejos.",
          );
        }

        if (cancelled) {
          return;
        }

        const eligibleTips = (result?.tips ?? []).filter((tip) =>
          matchesQuickTipAudience(
            tip,
            profileArea,
            profileCampaign,
            profileEmployeeType,
          ),
        );

        if (eligibleTips.length === 0) {
          return;
        }

        const profileIdentity =
          profileId ||
          [profileName, profileArea, profileCampaign, profileEmployeeType]
            .map((value) => value.trim())
            .join("|");

        const storageKey =
          `tc-rh-mural-quick-tips:${encodeURIComponent(profileIdentity || "profile")}:${getLocalDateKey()}`;
        const lastTipStorageKey = `${storageKey}:last`;
        const eligibleTipIds = new Set(
          eligibleTips.map((tip) => String(tip.id)),
        );

        const readSeenIds = (): string[] => {
          try {
            const saved = window.localStorage.getItem(storageKey);
            const parsed: unknown = saved ? JSON.parse(saved) : [];

            if (!Array.isArray(parsed)) {
              return [];
            }

            return parsed
              .map((id) => String(id))
              .filter((id) => eligibleTipIds.has(id));
          } catch {
            return [];
          }
        };

        const saveSeenIds = (ids: string[]): void => {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(ids));
          } catch {
            // Los consejos seguirán funcionando si el navegador bloquea storage.
          }
        };

        const readLastTipId = (): string => {
          try {
            return window.localStorage.getItem(lastTipStorageKey) ?? "";
          } catch {
            return "";
          }
        };

        const saveLastTipId = (id: string): void => {
          try {
            window.localStorage.setItem(lastTipStorageKey, id);
          } catch {
            // No bloqueamos el Mural si no se puede guardar el último consejo.
          }
        };

        const shuffleTips = (
          tips: QuickTip[],
          previousTipId: string,
        ): QuickTip[] => {
          const shuffled = [...tips];

          // Fisher-Yates: mezcla aleatoria sin perder ni duplicar consejos.
          for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            const currentTip = shuffled[index];
            const replacementTip = shuffled[randomIndex];

            if (currentTip && replacementTip) {
              shuffled[index] = replacementTip;
              shuffled[randomIndex] = currentTip;
            }
          }

          // Evita que el ciclo nuevo empiece con el mismo consejo anterior.
          if (
            shuffled.length > 1 &&
            String(shuffled[0].id) === previousTipId
          ) {
            const alternativeIndex = shuffled.findIndex(
              (tip, index) =>
                index > 0 && String(tip.id) !== previousTipId,
            );

            if (alternativeIndex > 0) {
              const firstTip = shuffled[0];
              const alternativeTip = shuffled[alternativeIndex];

              if (firstTip && alternativeTip) {
                shuffled[0] = alternativeTip;
                shuffled[alternativeIndex] = firstTip;
              }
            }
          }

          return shuffled;
        };

        let cycleSeenIds = readSeenIds();
        let queue = eligibleTips.filter(
          (tip) => !cycleSeenIds.includes(String(tip.id)),
        );
        const lastTipId = readLastTipId();

        // Si ya se mostraron todos, comenzamos de nuevo con un ciclo aleatorio.
        if (queue.length === 0) {
          cycleSeenIds = [];
          saveSeenIds(cycleSeenIds);
          queue = [...eligibleTips];
        }

        queue = shuffleTips(queue, lastTipId);
        let queueIndex = 0;
        let mostRecentlyShownTipId = lastTipId;

        // 12 segundos para leer y 6 segundos de pausa antes del siguiente consejo.
        const intervalBetweenTipsMs = 18_000;
        const pauseBetweenCyclesMs = 30_000;

        const showNextTip = (): void => {
          if (cancelled) {
            return;
          }

          // Terminó la vuelta: reiniciamos el registro y hacemos una nueva mezcla.
          if (queueIndex >= queue.length) {
            cycleSeenIds = [];
            saveSeenIds(cycleSeenIds);
            queue = shuffleTips(eligibleTips, mostRecentlyShownTipId);
            queueIndex = 0;

            // Una pausa breve entre vueltas evita que los consejos se sientan repetitivos.
            timerId = window.setTimeout(showNextTip, pauseBetweenCyclesMs);
            return;
          }

          const tip = queue[queueIndex];
          queueIndex += 1;
          const tipId = String(tip.id);

          if (!cycleSeenIds.includes(tipId)) {
            cycleSeenIds = [...cycleSeenIds, tipId];
          }

          saveSeenIds(cycleSeenIds);
          saveLastTipId(tipId);
          mostRecentlyShownTipId = tipId;

          try {
            // Cada consejo usa un ID propio para que Sileo monte una notificación
            // nueva con su animación de entrada, en lugar de transformar la anterior.
            const toastOptions: SileoOptions & { id: string } = {
              id: `tc-rh-quick-tip-${tipId}-${Date.now()}-${queueIndex}`,
              title: `💡 ${tip.title}`,
              description: tip.message,
              duration: 12_000,
            };

            // Conservamos el ID explícito para poder cerrarlo al salir del Mural.
            sileo.info(toastOptions);
            activeToastId = toastOptions.id;
          } catch (error) {
            console.warn(
              "[Mural] No se pudo mostrar un consejo emergente:",
              error instanceof Error ? error.message : "Error desconocido",
            );
          }

          // El consejo dura 12 s; luego dejamos 0,8 s para completar la animación de salida de Sileo.
          timerId = window.setTimeout(showNextTip, intervalBetweenTipsMs);
        };

        timerId = window.setTimeout(showNextTip, 0);
      } catch (error) {
        // Un error en los consejos no debe romper el Mural.
        console.warn(
          "[Mural] No se pudieron cargar los consejos emergentes:",
          error instanceof Error ? error.message : "Error desconocido",
        );
      }
    };

    void showQuickTips();

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }

      // Evita que el consejo permanezca visible al entrar a WhatsApp,
      // Configuración u otra sección de la aplicación.
      if (activeToastId) {
        sileo.dismiss(activeToastId);
        activeToastId = undefined;
      }
    };
  }, [
    isProfileLoading,
    profileId,
    profileName,
    profileArea,
    profileCampaign,
    profileEmployeeType,
  ]);

  const [isCreatePostOpen, setIsCreatePostOpen] =
    useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postLoadError, setPostLoadError] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [muralCountries, setMuralCountries] = useState<string[]>([]);
  const [muralAreas, setMuralAreas] = useState<string[]>([]);
  const [muralCampaigns, setMuralCampaigns] = useState<MuralCampaign[]>([]);

  // Empleados ve opciones derivadas de las publicaciones a las que ya tiene acceso;
  // Administradores además ven las opciones completas procedentes de Empleados.
  const filterCountries = useMemo(() => uniquePostOptions([
    ...muralCountries,
    ...posts.map((post) => post.country ?? (post.audience === "country" ? post.audienceValue : "")),
  ]), [muralCountries, posts]);
  const filterAreas = useMemo(() => uniquePostOptions([
    ...muralAreas,
    ...posts.map((post) => post.area ?? (post.audience === "area" ? post.audienceValue : "")),
  ]), [muralAreas, posts]);
  const filterCampaigns = useMemo(() => uniquePostOptions([
    ...muralCampaigns.map((campaign) => campaign.name),
    ...posts.map((post) => post.campaign ?? (post.audience === "campaign" ? post.audienceValue : "")),
  ]), [muralCampaigns, posts]);

  const [editingPost, setEditingPost] =
    useState<Post | null>(null);

  const [postToDelete, setPostToDelete] =
    useState<Post | null>(null);

  const [countryFilter, setCountryFilter] =
    useState("all");

  const [areaFilter, setAreaFilter] =
    useState("all");

  const [campaignFilter, setCampaignFilter] =
    useState("all");

  const [openSelect, setOpenSelect] = useState("");

  // Las publicaciones se cargan desde la API; ya no usamos initialPosts de demostración.
  useEffect(() => {
    if (isProfileLoading) return;

    let cancelled = false;
    const loadPosts = async () => {
      setIsLoadingPosts(true);
      setPostLoadError("");
      try {
        const response = await fetch("/api/mural/posts", {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json() as MuralPostsResponse;
        if (!response.ok) {
          throw new Error(result.error || "No se pudieron cargar las publicaciones.");
        }
        if (!cancelled) setPosts(result.posts ?? []);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error
          ? error.message
          : "No se pudieron cargar las publicaciones.";
        setPostLoadError(message);
        setPosts([]);
        console.error("[Mural] Error cargando publicaciones:", error);
      } finally {
        if (!cancelled) setIsLoadingPosts(false);
      }
    };

    void loadPosts();
    return () => { cancelled = true; };
  }, [isProfileLoading]);

  // Las opciones de segmentación provienen de los empleados activos, no de datos de ejemplo.
  useEffect(() => {
    if (isProfileLoading || !isAdmin) return;
    let cancelled = false;
    const loadOptions = async () => {
      try {
        const response = await fetch("/api/mural/options", {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json() as MuralOptionsResponse;
        if (!response.ok) throw new Error(result.error || "No se pudieron cargar las opciones del Mural.");
        if (cancelled) return;
        setMuralCountries(result.countries ?? []);
        setMuralAreas(result.areas ?? []);
        setMuralCampaigns(result.campaigns ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error("[Mural] No se pudieron cargar las opciones de segmentación:", error);
          sileo.error({
            title: "No se pudieron cargar las opciones",
            description: error instanceof Error ? error.message : "Revisa el módulo Empleados.",
          });
        }
      }
    };
    void loadOptions();
    return () => { cancelled = true; };
  }, [isProfileLoading, isAdmin]);

  /*
   * =========================
   * SELECTS
   * =========================
   */

  const toggleSelect = (
    selectName: string,
  ) => {
    setOpenSelect((currentSelect) =>
      currentSelect === selectName
        ? ""
        : selectName,
    );
  };

  const handleChange = (
    selectName: string,
    value: string,
  ) => {
    if (selectName === "country") {
      setCountryFilter(value);
    }

    if (selectName === "area") {
      setAreaFilter(value);
    }

    if (selectName === "campaign") {
      setCampaignFilter(value);
    }

    setOpenSelect("");
  };

  /*
   * =========================
   * CREAR PUBLICACIÓN
   * =========================
   */

  const handleCreatePost = async (newPost: NewPost): Promise<boolean> => {
    if (!isAdmin || isSavingPost) return false;
    setIsSavingPost(true);
    try {
      const response = await fetch("/api/mural/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ post: newPost }),
      });
      const result = await response.json() as MuralPostResponse;
      if (!response.ok || !result.post) {
        throw new Error(result.error || "No se pudo guardar la publicación.");
      }
      setPosts((current) => [result.post!, ...current]);
      sileo.success({
        title: "Publicación creada",
        description: "La publicación se guardó correctamente.",
      });
      return true;
    } catch (error) {
      console.error("[Mural] Error creando publicación:", error);
      sileo.error({
        title: "No se pudo publicar",
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
      return false;
    } finally {
      setIsSavingPost(false);
    }
  };

  /*
   * =========================
   * EDITAR PUBLICACIÓN
   * =========================
   */

  const handleEditPost = (
    post: Post,
  ) => {
    setEditingPost(post);
  };

  const handleUpdatePost = async (updatedPost: NewPost): Promise<boolean> => {
    if (!editingPost || !isAdmin || isSavingPost) return false;
    setIsSavingPost(true);
    try {
      const response = await fetch("/api/mural/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id: editingPost.id, post: updatedPost }),
      });
      const result = await response.json() as MuralPostResponse;
      if (!response.ok || !result.post) {
        throw new Error(result.error || "No se pudieron guardar los cambios.");
      }
      setPosts((current) => current.map((post) =>
        post.id === result.post!.id ? result.post! : post,
      ));
      sileo.success({
        title: "Publicación actualizada",
        description: "Los cambios se guardaron correctamente.",
      });
      return true;
    } catch (error) {
      console.error("[Mural] Error actualizando publicación:", error);
      sileo.error({
        title: "No se pudieron guardar los cambios",
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
      return false;
    } finally {
      setIsSavingPost(false);
    }
  };

  /*
   * =========================
   * ELIMINAR PUBLICACIÓN
   * =========================
   */

  const handleDeletePost = (
    postId: number,
  ) => {
    const post = posts.find(
      (currentPost) =>
        currentPost.id === postId,
    );

    if (!post) {
      return;
    }

    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete || !isAdmin || isSavingPost) return;
    setIsSavingPost(true);
    try {
      const response = await fetch("/api/mural/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id: postToDelete.id }),
      });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo eliminar la publicación.");
      }
      setPosts((current) => current.filter((post) => post.id !== postToDelete.id));
      setPostToDelete(null);
      sileo.success({
        title: "Publicación eliminada",
        description: "La publicación se eliminó correctamente.",
      });
    } catch (error) {
      console.error("[Mural] Error eliminando publicación:", error);
      sileo.error({
        title: "No se pudo eliminar la publicación",
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleReactPost = async (
    postId: number,
    reaction: PostReaction,
  ): Promise<{ reaction: PostReaction; likes: number; dislikes: number }> => {
    const response = await fetch("/api/mural/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ postId, reaction }),
    });
    const result = await response.json() as MuralReactionResponse;
    if (!response.ok) {
      throw new Error(result.error || "No se pudo guardar la reacción.");
    }
    const savedReaction = result.reaction ?? null;
    const likes = Number(result.likes ?? 0);
    const dislikes = Number(result.dislikes ?? 0);
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, myReaction: savedReaction, likes, dislikes }
      : post,
    ));
    return { reaction: savedReaction, likes, dislikes };
  };

  /*
   * =========================
   * FILTRADO
   * =========================
   */

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const filteredPosts = posts.filter(
    (post) => {
      const searchableValues = [
        post.title,
        post.content,
        post.author,
        post.audienceValue,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
          .filter(
            (value): value is string =>
              Boolean(value),
          )
          .some((value) =>
            value
              .toLowerCase()
              .includes(
                normalizedSearch,
              ),
          );

      const matchesCountry =
  countryFilter === "all" || post.country === countryFilter;

const matchesArea =
  areaFilter === "all" || post.area === areaFilter;

const matchesCampaign =
  campaignFilter === "all" || post.campaign === campaignFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesArea &&
        matchesCampaign
      );
    },
  );

  /*
   * =========================
   * FILTROS ACTIVOS
   * =========================
   */

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    countryFilter !== "all" ||
    areaFilter !== "all" ||
    campaignFilter !== "all";

  const handleClearFilters = () => {
    setSearchTerm("");

    setCountryFilter("all");
    setAreaFilter("all");
    setCampaignFilter("all");
    setOpenSelect("");
  };

  return (
    <section className="mural-page">
      {/* =========================
          HEADER DEL MURAL
         ========================= */}

      <div className="mural-page__heading">
        <div>
          <span className="mural-page__eyebrow">
            Talento & Cultura
          </span>

          <h1>Mural</h1>

          <p>
            Mantente informado sobre las
            novedades y comunicaciones de la
            empresa.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="mural-page__create-button"
            onClick={() => setIsCreatePostOpen(true)}
            disabled={isSavingPost}
          >
            <Plus size={18} />
            <span>Crear publicación</span>
          </button>
        )}
      </div>

      {/* =========================
          FILTROS
         ========================= */}

      <div className="mural-page__filters">
        <div className="mural-page__filter-group">
          <SlidersHorizontal size={17} />

          <CustomSelect
            options={filterCountries}
            value={
              countryFilter === "all"
                ? ""
                : countryFilter
            }
            placeholder="Todos los países"
            isOpen={
              openSelect === "country"
            }
            onChange={(value) =>
              handleChange(
                "country",
                value,
              )
            }
            onToggle={() =>
              toggleSelect("country")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

          <CustomSelect
            options={filterAreas}
            value={
              areaFilter === "all"
                ? ""
                : areaFilter
            }
            placeholder="Todas las áreas"
            isOpen={
              openSelect === "area"
            }
            onChange={(value) =>
              handleChange(
                "area",
                value,
              )
            }
            onToggle={() =>
              toggleSelect("area")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

          <CustomSelect
            options={filterCampaigns}
            value={
              campaignFilter === "all"
                ? ""
                : campaignFilter
            }
            placeholder="Todas las campañas"
            isOpen={
              openSelect === "campaign"
            }
            onChange={(value) =>
              handleChange(
                "campaign",
                value,
              )
            }
            onToggle={() =>
              toggleSelect("campaign")
            }
            onClose={() =>
              setOpenSelect("")
            }
          />

          {hasActiveFilters && (
            <button
              type="button"
              className="mural-page__clear-filters"
              onClick={
                handleClearFilters
              }
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <X size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================
          PUBLICACIONES
         ========================= */}

      <div className="mural-page__feed">
        {isLoadingPosts && (
          <div className="mural-page__empty">Cargando publicaciones...</div>
        )}
        {!isLoadingPosts && postLoadError && (
          <div className="mural-page__empty" role="alert">{postLoadError}</div>
        )}
        {filteredPosts.map(
          (post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              author={post.author}
              date={post.date}
              likes={post.likes}
              dislikes={post.dislikes}
              myReaction={post.myReaction}
              onReactionChange={handleReactPost}
              image={post.image}
              link={post.link}
              audience={post.audience}
              audienceValue={
                post.audienceValue
              }
              attachments={
                post.attachments
              }
              isDarkMode={isDarkMode}
              isAdmin={isAdmin}
              onEdit={() =>
                handleEditPost(post)
              }
              onDelete={() =>
                handleDeletePost(
                  post.id,
                )
              }
            />
          ),
        )}

        {!isLoadingPosts && !postLoadError && filteredPosts.length === 0 && (
          <div className="mural-page__empty">
            <Search size={24} />

            <h3>
              No encontramos
              publicaciones
            </h3>

            <p>
              Prueba con otro término
              o cambia los filtros.
            </p>
          </div>
        )}
      </div>

      {/* =========================
          CREAR
         ========================= */}

      <CreatePostModal
        isOpen={
          isCreatePostOpen
        }
        countries={muralCountries}
        areas={muralAreas}
        campaigns={muralCampaigns}
        isSubmitting={isSavingPost}
        onClose={() =>
          setIsCreatePostOpen(false)
        }
        onCreatePost={
          handleCreatePost
        }
      />

      {/* =========================
          EDITAR
         ========================= */}

      <CreatePostModal
        key={
          editingPost?.id ??
          "edit-post"
        }
        isOpen={
          editingPost !== null
        }
        countries={muralCountries}
        areas={muralAreas}
        campaigns={muralCampaigns}
        isSubmitting={isSavingPost}
        onClose={() =>
          setEditingPost(null)
        }
        onCreatePost={
          handleUpdatePost
        }
        mode="edit"
        initialPost={
          editingPost
            ? {
                title:
                  editingPost.title,
                content:
                  editingPost.content,
                audience:
                  editingPost.audience ??
                  "all",
                audienceValue:
                  editingPost.audienceValue,
                country:
                  editingPost.country,
                area:
                  editingPost.area,
                campaign:
                  editingPost.campaign,
                image:
                  editingPost.image,
                imagePath:
                  editingPost.imagePath,
                link:
                  editingPost.link,
                attachments:
                  editingPost.attachments,
              }
            : undefined
        }
      />

      {/* =========================
          ELIMINAR
         ========================= */}

      <ConfirmModal
        isOpen={
          postToDelete !==
          null
        }
        title="Eliminar publicación"
        message="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={
          handleConfirmDelete
        }
        onCancel={() =>
          setPostToDelete(null)
        }
      />
    </section>
  );
}