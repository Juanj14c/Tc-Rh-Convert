"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreVertical, Pencil, ThumbsDown, ThumbsUp, Trash2, FileText,
  FileSpreadsheet, FileArchive, Presentation, File, ExternalLink, Download,
} from "lucide-react";
import { sileo } from "sileo";
import type { PostAudience, PostAttachment, PostReaction } from "@/types/mural";

interface ReactionResult {
  reaction: PostReaction;
  likes: number;
  dislikes: number;
}

interface PostCardProps {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  dislikes: number;
  myReaction?: PostReaction;
  image?: string;
  link?: string;
  audience?: PostAudience;
  audienceValue?: string;
  attachments?: PostAttachment[];
  isDarkMode: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReactionChange?: (postId: number, reaction: PostReaction) => Promise<ReactionResult>;
}

const MAX_CONTENT_LENGTH = 220;

const getAttachmentIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf": case "doc": case "docx": case "txt": return <FileText size={20} />;
    case "xls": case "xlsx": return <FileSpreadsheet size={20} />;
    case "ppt": case "pptx": return <Presentation size={20} />;
    case "zip": return <FileArchive size={20} />;
    default: return <File size={20} />;
  }
};

export default function PostCard({
  id, title, content, author, date,
  likes: initialLikes, dislikes: initialDislikes, myReaction,
  image, link, audience = "all", audienceValue, attachments,
  isDarkMode, isAdmin = false, onEdit, onDelete, onReactionChange,
}: PostCardProps) {
  const [reaction, setReaction] = useState<PostReaction>(myReaction ?? null);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isReacting, setIsReacting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Sincroniza la tarjeta cuando cambian los datos que devuelve Supabase.
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setReaction(myReaction ?? null);
  }, [id, initialLikes, initialDislikes, myReaction]);

  const isLongContent = content.length > MAX_CONTENT_LENGTH;
  const displayedContent = isLongContent && !isExpanded
    ? `${content.slice(0, MAX_CONTENT_LENGTH).trim()}...`
    : content;

  const changeReaction = async (target: Exclude<PostReaction, null>) => {
    if (isReacting || !onReactionChange) return;
    const nextReaction: PostReaction = reaction === target ? null : target;
    setIsReacting(true);
    try {
      const result = await onReactionChange(id, nextReaction);
      setReaction(result.reaction);
      setLikes(result.likes);
      setDislikes(result.dislikes);
    } catch (error) {
      sileo.error({
        title: "No se pudo guardar la reacción",
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setIsReacting(false);
    }
  };

  const getAudienceLabel = () => {
    switch (audience) {
      case "campaign": return `Campaña: ${audienceValue ?? ""}`;
      case "area": return `Área: ${audienceValue ?? ""}`;
      case "country": return `País: ${audienceValue ?? ""}`;
      default: return "Todos los empleados";
    }
  };

  const logoSrc = isDarkMode
    ? "/assets/brand/simbolo_claro.png"
    : "/assets/brand/simbolo_oscuro.png";

  return (
    <article className="post-card">
      <header className="post-card__header">
        <div className="post-card__avatar">
          <img src={logoSrc} alt="Talento & Cultura" className="post-card__avatar-image" />
        </div>
        <div className="post-card__author">
          <h3>{author}</h3>
          <span>{date}</span>
          <span className="post-card__audience">{getAudienceLabel()}</span>
        </div>
        {isAdmin && (
          <div ref={menuRef} className="post-card__menu">
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
                <button type="button" onClick={() => { setIsMenuOpen(false); onEdit?.(); }}>
                  <Pencil size={16} /><span>Editar</span>
                </button>
                <button
                  type="button"
                  className="post-card__menu-delete"
                  onClick={() => { setIsMenuOpen(false); onDelete?.(); }}
                >
                  <Trash2 size={16} /><span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {image && <div className="post-card__image"><img src={image} alt={title} /></div>}

      <div className="post-card__body">
        <h2>{title}</h2>
        <p>{displayedContent}</p>
        {isLongContent && (
          <button type="button" className="post-card__read-more" onClick={() => setIsExpanded((current) => !current)}>
            {isExpanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      {link && (
        <div className="post-card__link">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <span>Abrir enlace</span><span aria-hidden="true">↗</span>
          </a>
        </div>
      )}

      {attachments && attachments.length > 0 && (
        <div className="post-card__attachments">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="post-card__attachment">
              <div className="post-card__attachment-icon">{getAttachmentIcon(attachment.name)}</div>
              <div className="post-card__attachment-info">
                <strong title={attachment.name}>{attachment.name}</strong>
                <span>{attachment.size < 1024 * 1024
                  ? `${(attachment.size / 1024).toFixed(1)} KB`
                  : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}</span>
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
                  <ExternalLink size={16} /><span>Abrir</span>
                </a>
                <a
                  href={attachment.dataUrl}
                  download={attachment.name}
                  className="post-card__attachment-download"
                  aria-label={`Descargar ${attachment.name}`}
                  title="Descargar archivo"
                >
                  <Download size={16} /><span>Descargar</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="post-card__footer">
        <button
          type="button"
          className={`post-card__action ${reaction === "like" ? "post-card__action--active-like" : ""}`}
          onClick={() => void changeReaction("like")}
          disabled={isReacting}
          aria-pressed={reaction === "like"}
          aria-label={reaction === "like" ? "Quitar me gusta" : "Me gusta"}
        >
          <ThumbsUp size={18} strokeWidth={reaction === "like" ? 2.5 : 2} /><span>{likes}</span>
        </button>
        <button
          type="button"
          className={`post-card__action ${reaction === "dislike" ? "post-card__action--active-dislike" : ""}`}
          onClick={() => void changeReaction("dislike")}
          disabled={isReacting}
          aria-pressed={reaction === "dislike"}
          aria-label={reaction === "dislike" ? "Quitar no me gusta" : "No me gusta"}
        >
          <ThumbsDown size={18} strokeWidth={reaction === "dislike" ? 2.5 : 2} /><span>{dislikes}</span>
        </button>
      </footer>
    </article>
  );
}
