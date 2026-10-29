export type PostAudience =
  | "all"
  | "campaign"
  | "area"
  | "country";

export type PostReaction = "like" | "dislike" | null;

export interface MuralCampaign {
  id: string;
  name: string;
  country: string;
  site?: string;
}

export interface PostAttachment {
  id: string;
  name: string;
  type: string;
  size: number;

  /** URL temporal para visualizar o descargar el archivo. */
  dataUrl: string;

  /** Ruta persistente en el bucket privado de Supabase. */
  storagePath?: string;
}

export interface NewPost {
  title: string;
  content: string;
  audience: PostAudience;
  audienceValue?: string;
  country?: string;
  area?: string;
  campaign?: string;
  image?: string;
  imagePath?: string;
  link?: string;
  attachments?: PostAttachment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  createdAt?: string;
  likes: number;
  dislikes: number;
  myReaction?: PostReaction;
  image?: string;
  imagePath?: string;
  audience?: PostAudience;
  audienceValue?: string;
  country?: string;
  area?: string;
  campaign?: string;
  link?: string;
  attachments?: PostAttachment[];
}