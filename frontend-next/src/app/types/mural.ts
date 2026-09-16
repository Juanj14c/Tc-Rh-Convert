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
  audience: PostAudience;
  audienceValue?: string;
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
  dislikes: number;
  image?: string;
  audience?: PostAudience;
  audienceValue?: string;
  link?: string;
  attachments?: PostAttachment[];
}