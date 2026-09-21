"use client";

import { useState } from "react";
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

import {
  initialPosts,
  muralCountries,
  muralAreas,
  muralCampaigns,
} from "@/data/mural";

import type {
  Post,
  NewPost,
} from "@/types/mural";

export default function MuralPage() {
  const { isDarkMode } = useTheme();

  const {
    searchTerm,
    setSearchTerm,
  } = useSearch();

  const [isCreatePostOpen, setIsCreatePostOpen] =
    useState(false);

  const [posts, setPosts] =
    useState<Post[]>(initialPosts);

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

  const [openSelect, setOpenSelect] =
    useState("");

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

  const handleCreatePost = (
    newPost: NewPost,
  ) => {
    const post: Post = {
      id: Date.now(),
      title: newPost.title,
      content: newPost.content,
      author: "Talento & Cultura",
      date: "Ahora",
      likes: 0,
      dislikes: 0,
      image: newPost.image,
      audience: newPost.audience,
      audienceValue:
        newPost.audienceValue,
      link: newPost.link,
      attachments:
        newPost.attachments,
    };

    setPosts((currentPosts) => [
      post,
      ...currentPosts,
    ]);

    setIsCreatePostOpen(false);
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

  const handleUpdatePost = (
    updatedPost: NewPost,
  ) => {
    if (!editingPost) {
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === editingPost.id
          ? {
              ...post,
              title: updatedPost.title,
              content: updatedPost.content,
              image: updatedPost.image,
              link: updatedPost.link,
              audience:
                updatedPost.audience,
              audienceValue:
                updatedPost.audienceValue,
              attachments:
                updatedPost.attachments,
            }
          : post,
      ),
    );

    setEditingPost(null);
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

  const handleConfirmDelete = () => {
    if (!postToDelete) {
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.filter(
        (post) =>
          post.id !==
          postToDelete.id,
      ),
    );

    setPostToDelete(null);
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
  countryFilter === "all" ||
  (post.audience === "country" &&
    post.audienceValue ===
      countryFilter);

const matchesArea =
  areaFilter === "all" ||
  (post.audience === "area" &&
    post.audienceValue ===
      areaFilter);

const matchesCampaign =
  campaignFilter === "all" ||
  (post.audience === "campaign" &&
    post.audienceValue ===
      campaignFilter);

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

        <button
          type="button"
          className="mural-page__create-button"
          onClick={() =>
            setIsCreatePostOpen(true)
          }
        >
          <Plus size={18} />
          <span>
            Crear publicación
          </span>
        </button>
      </div>

      {/* =========================
          FILTROS
         ========================= */}

      <div className="mural-page__filters">
        <div className="mural-page__filter-group">
          <SlidersHorizontal size={17} />

          <CustomSelect
            options={muralCountries}
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
            options={muralAreas}
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
            options={muralCampaigns.map(
              (campaing)=> campaing.name,
            )}
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
              isAdmin={true}
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

        {filteredPosts.length ===
          0 && (
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
                image:
                  editingPost.image,
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