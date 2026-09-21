import type { Post } from "@/types/mural";

export interface MuralCampaign {
  id: string;
  name: string;
  country: string;
  site?: string;
}

export const initialPosts: Post[] = [
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

export const muralCountries = [
  "Colombia",
  "México",
  "España",
  "Chile",
];

export const muralAreas = [
  "Financiera",
  "Operaciones",
  "Talento & Cultura",
  "Servicio al Cliente",
];

export const muralCampaigns: MuralCampaign[] = [
  {
    id: "wom-chile",
    name: "WOM Chile",
    country: "Chile",
    site: "Chile",
  },
  {
    id: "campana-colombia-1",
    name: "Campaña Colombia 1",
    country: "Colombia",
  },
  {
    id: "campana-colombia-2",
    name: "Campaña Colombia 2",
    country: "Colombia",
  },
  {
    id: "campana-mexico-1",
    name: "Campaña México 1",
    country: "México",
    
  },
  {
    id: "campana-espana-1",
    name: "Campaña España 1",
    country: "España",
  },
];