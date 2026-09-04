export interface Conversation {
  id: number;
  name: string;
  preview: string;
  time: string;
  unread: number;

  countryCode?: "CO" | "MX" | "ES";
  countryName?: string;
  area?: string;
  campaign?: string;
  status?: "Pendiente" | "En atención" | "Resuelto";
}

export const conversations: Conversation[] = [
  {
    id: 1,
    name: "Caso #1024",
    preview: "Hola, quería hacer una consulta...",
    time: "10:42",
    unread: 2,
    countryCode: "CO",
    countryName: "Colombia",
    area: "Comercial",
    campaign: "WOM",
    status: "En atención",
  },

  {
    id: 2,
    name: "Caso #1025",
    preview: "¿Me pueden ayudar con una duda?",
    time: "09:18",
    unread: 1,
    countryCode: "MX",
    countryName: "México",
    area: "Recursos Humanos",
    campaign: "Campaña A",
    status: "Pendiente",
  },

  {
    id: 3,
    name: "Caso #1026",
    preview: "Gracias por la atención.",
    time: "Ayer",
    unread: 0,
    countryCode: "ES",
    countryName: "España",
    area: "Desarrollo",
    campaign: "Campaña B",
    status: "Resuelto",
  },
];