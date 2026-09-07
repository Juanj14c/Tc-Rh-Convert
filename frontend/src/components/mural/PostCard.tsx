import { useState } from "react";
import {
  MoreVertical,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  File,
  ExternalLink,
  Download,
} from "lucide-react";
import simboloClaro from "../../assets/brand/simbolo_oscuro.png";
import simboloOscuro from "../../assets/brand/simbolo_claro.png";
import type { PostAttachment } from "./CreatePostModal";

type PostAudience = "all" | "campaign" | "area" | "country";

interface PostCardProps {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  dislikes: number;
  image?: string;
  link?: string;
  audience?: PostAudience;
  audienceValue?: string;
  attachments?: PostAttachment[];
  isDarkMode: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MAX_CONTENT_LENGTH = 220;
const getAttachmentIcon =(fileName: string) =>{
  const extesion = fileName
    .split(".")
    .pop()
    ?.toLowerCase();
  switch (extesion){
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText size={20} />;

    case "xls":
    case "xlsx":
      return <FileSpreadsheet size={20} />
    case "ppt":
    case "pptx":
      return <Presentation size ={20} />
    case " zip":
      return<FileArchive size={20} />
    default:
      return <File size={20} />
  }
};

function PostCard({
  title,
  content,
  author,
  date,
  likes: initialLikes,
  dislikes: initialDislikes,
  image,
  link,
  audience = "all",
  audienceValue,
  attachments,
  isDarkMode,
  isAdmin = false,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(
    null,
  );
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLongContent = content.length > MAX_CONTENT_LENGTH;

  const displayedContent =
    isLongContent && !isExpanded
      ? `${content.slice(0, MAX_CONTENT_LENGTH).trim()}...`
      : content;

  const handleLike = () => {
    if (reaction === "like") {
      setReaction(null);
      setLikes((current) => current - 1);
      return;
    }

    if (reaction === "dislike") {
      setDislikes((current) => current - 1);
    }

    setReaction("like");
    setLikes((current) => current + 1);
  };

  const handleDislike = () => {
    if (reaction === "dislike") {
      setReaction(null);
      setDislikes((current) => current - 1);
      return;
    }

    if (reaction === "like") {
      setLikes((current) => current - 1);
    }

    setReaction("dislike");
    setDislikes((current) => current + 1);
  };

  const getAudienceLabel = () => {
    switch (audience) {
      case "campaign":
        return `Campaña: ${audienceValue ?? ""}`;

      case "area":
        return `Área: ${audienceValue ?? ""}`;

      case "country":
        return `País: ${audienceValue ?? ""}`;

      default:
        return "Todos los empleados";
    }
  };

  return (
    <article className="post-card">
      <header className="post-card__header">
        <div className="post-card__avatar">
          <img
            src={isDarkMode ? simboloOscuro : simboloClaro}
            alt="Talento & Cultura"
            className="post-card__avatar-image"
          />
        </div>

        <div className="post-card__author">
          <h3>{author}</h3>

          <span>{date}</span>

          <span className="post-card__audience">
            {getAudienceLabel()}
          </span>
        </div>

        {isAdmin && (
          <div className="post-card__menu">
            <button
              type="button"
              className="post-card__menu-button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="Opciones de publicación"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={20} />
            </button>

            {isMenuOpen && (
              <div className="post-card__menu-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit?.();
                  }}
                >
                  <Pencil size={16} />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  className="post-card__menu-delete"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete?.();
                  }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {image && (
        <div className="post-card__image">
          <img src={image} alt={title} />
        </div>
      )}

      <div className="post-card__body">
        <h2>{title}</h2>

        <p>{displayedContent}</p>

        {isLongContent && (
          <button
            type="button"
            className="post-card__read-more"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      {link && (
        <div className="post-card__link">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Abrir enlace</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
      {attachments && attachments.length > 0 && (
  <div className="post-card__attachments">
    {attachments.map((attachment) => (
      <div
        key={attachment.id}
        className="post-card__attachment"
      >
        <div className="post-card__attachment-icon">
          {getAttachmentIcon(attachment.name)}
        </div>

        <div className="post-card__attachment-info">
          <strong title={attachment.name}>
            {attachment.name}
          </strong>

          <span>
            {attachment.size < 1024 * 1024
              ? `${(attachment.size / 1024).toFixed(1)} KB`
              : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
          </span>
        </div>

        <div className="post-card__attachment-actions">
          <a
            href={attachment.dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="post-card__attachment-open"
            aria-label={`Abrir ${attachment.name}`}
            title="Abrir archivo"
          >
            <ExternalLink size={16} />
            <span>Abrir</span>
          </a>

          <a
            href={attachment.dataUrl}
            download={attachment.name}
            className="post-card__attachment-download"
            aria-label={`Descargar ${attachment.name}`}
            title="Descargar archivo"
          >
            <Download size={16} />
            <span>Descargar</span>
          </a>
        </div>
      </div>
    ))}
  </div>
)}
      <footer className="post-card__footer">
        <button
          type="button"
          className={`post-card__action ${
            reaction === "like"
              ? "post-card__action--active-like"
              : ""
          }`}
          onClick={handleLike}
        >
          <ThumbsUp
            size={18}
            strokeWidth={reaction === "like" ? 2.5 : 2}
          />
          <span>{likes}</span>
        </button>

        <button
          type="button"
          className={`post-card__action ${
            reaction === "dislike"
              ? "post-card__action--active-dislike"
              : ""
          }`}
          onClick={handleDislike}
        >
          <ThumbsDown
            size={18}
            strokeWidth={reaction === "dislike" ? 2.5 : 2}
          />
          <span>{dislikes}</span>
        </button>
      </footer>
    </article>
  );
}

export default PostCard;