export type PostAudience =
  | "all"
  | "campaign"
  | "area"
  | "country";

export interface PostAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface NewPost {
  title: string;
  content: string;

  // Tipo de segmentación principal
  audience: PostAudience;
  audienceValue?: string;

  // Segmentación detallada
  country?: string;
  area?: string;
  campaign?: string;

  image?: string;
  link?: string;
  attachments?: PostAttachment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  dislikes: number
  
  image?: string;

  // Tipo de segmentación principal
  audience?: PostAudience;
 audienceValue?: string;
  // Segmentación detallada
  country?: string;
  area?: string;
  campaign?: string;

  link?: string;
  attachments?: PostAttachment[];
}