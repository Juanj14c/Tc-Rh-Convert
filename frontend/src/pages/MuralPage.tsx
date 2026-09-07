import { useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";

import CreatePostModal, {
  type NewPost,
  type PostAudience,
  type PostAttachment,
} from "../components/mural/CreatePostModal";

import PostCard from "../components/mural/PostCard";
import { useTheme } from "../contexts/useTheme";

interface MuralPageProps {
  isAdmin?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  dislikes: number;
  image?: string;
  audience?: PostAudience;
  audienceValue?: string;
  link?: string;
  attachments?: PostAttachment[];
}

const initialPosts: Post[] = [
  {
    id: 1,
    title: "Nueva campaña de bienestar",
    content:
      "Queremos compartir contigo las nuevas iniciativas que tenemos preparadas para todos nuestros colaboradores.",
    author: "Talento & Cultura",
    date: "Hoy",
    likes: 124,
    dislikes: 18,
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    audience: "all",
  },
  {
    id: 2,
    title: "Reconocimiento al equipo",
    content:
      "Gracias a todos por el excelente trabajo realizado durante este periodo.",
    author: "Talento & Cultura",
    date: "Ayer",
    likes: 98,
    dislikes: 7,
    audience: "all",
  },
];

const countries = ["Colombia", "México", "España"];

const areas = [
  "Financiera",
  "Operaciones",
  "Talento & Cultura",
  "Servicio al Cliente",
];

const campaigns = ["Campaña A", "Campaña B", "Campaña C"];

function MuralPage({
  isAdmin = false,
  searchTerm = "",
  onSearchChange,
}: MuralPageProps) {
  const { isDarkMode } = useTheme();

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [countryFilter, setCountryFilter] = useState("all");

  const [areaFilter, setAreaFilter] = useState("all");

  const [campaignFilter, setCampaignFilter] = useState("all");

  const handleCreatePost = (newPost: NewPost) => {
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
      audienceValue: newPost.audienceValue,
      link: newPost.link,
      attachments : newPost.attachments,
    };

    setPosts((currentPosts) => [post, ...currentPosts]);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
  };

  const handleUpdatePost = (updatedPost: NewPost) => {
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
              audience: updatedPost.audience,
              audienceValue: updatedPost.audienceValue,
              attachments: updatedPost.attachments,
            }
          : post,
      ),
    );

    setEditingPost(null);
  };

  const handleDeletePost = (postId: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar esta publicación?",
    );

    if (!confirmed) {
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    const searchableValues = [
      post.title,
      post.content,
      post.author,
      post.audienceValue,
    ];

    const matchesSearch =
      !normalizedSearch ||
      searchableValues
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch));

    const matchesCountry =
      countryFilter === "all" ||
      post.audience === "all" ||
      (post.audience === "country" && post.audienceValue === countryFilter);

    const matchesArea =
      areaFilter === "all" ||
      post.audience === "all" ||
      (post.audience === "area" && post.audienceValue === areaFilter);

    const matchesCampaign =
      campaignFilter === "all" ||
      post.audience === "all" ||
      (post.audience === "campaign" && post.audienceValue === campaignFilter);

    return matchesSearch && matchesCountry && matchesArea && matchesCampaign;
  });

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    countryFilter !== "all" ||
    areaFilter !== "all" ||
    campaignFilter !== "all";

  const handleClearFilters = () => {
    onSearchChange?.("");
    setCountryFilter("all");
    setAreaFilter("all");
    setCampaignFilter("all");
  };

  return (
    <section className="mural-page">
      <div className="mural-page__heading">
        <div>
          <span className="mural-page__eyebrow">Talento & Cultura</span>

          <h1>Mural</h1>

          <p>
            Mantente informado sobre las novedades y comunicaciones de la
            empresa.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="mural-page__create-button"
            onClick={() => setIsCreatePostOpen(true)}
          >
            <Plus size={18} />
            <span>Crear publicación</span>
          </button>
        )}
      </div>

      <div className="mural-page__filters">
        <div className="mural-page__filter-group">
          <SlidersHorizontal size={17} />

          <select
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
            aria-label="Filtrar por país"
          >
            <option value="all">Todos los países</option>

            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <select
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
            aria-label="Filtrar por área"
          >
            <option value="all">Todas las áreas</option>

            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            aria-label="Filtrar por campaña"
          >
            <option value="all">Todas las campañas</option>

            {campaigns.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="mural-page__clear-filters"
              onClick={handleClearFilters}
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <X size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      <div className="mural-page__feed">
        {filteredPosts.map((post) => (
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
            audienceValue={post.audienceValue}
            attachments ={post.attachments}
            isDarkMode={isDarkMode}
            isAdmin={isAdmin}
            onEdit={() => handleEditPost(post)}
            onDelete={() => handleDeletePost(post.id)}
          />
        ))}

        {filteredPosts.length === 0 && (
          <div className="mural-page__empty">
            <Search size={24} />

            <h3>No encontramos publicaciones</h3>

            <p>Prueba con otro término o cambia los filtros.</p>

            
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={handleCreatePost}
      />

      <CreatePostModal
        key={editingPost?.id ?? "edit-post"}
        isOpen={editingPost !== null}
        onClose={() => setEditingPost(null)}
        onCreatePost={handleUpdatePost}
        mode="edit"
        initialPost={
          editingPost
            ? {
                title: editingPost.title,
                content: editingPost.content,
                audience: editingPost.audience ?? "all",
                audienceValue: editingPost.audienceValue,
                image: editingPost.image,
                link: editingPost.link,
                attachments: editingPost.attachments,
              }
            : undefined
        }
      />
    </section>
  );
}

export default MuralPage;
