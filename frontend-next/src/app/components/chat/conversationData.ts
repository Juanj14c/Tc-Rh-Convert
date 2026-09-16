export type ChatMode = "anonymous" | "internal";

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
  type: ChatMode;
  avatar?: string;
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
    type: "anonymous",
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
    type: "anonymous",
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
    type: "anonymous",
  },
];

export const internalConversations: Conversation[] = [
  {
    id: 101,
    name: "Carlos Rodríguez",
    preview: "Hola, ¿me puedes ayudar con una consulta?",
    time: "11:05",
    unread: 2,
    countryCode: "CO",
    countryName: "Colombia",
    area: "Comercial",
    campaign: "WOM",
    type: "internal",
    avatar: "",
  },
  {
    id: 102,
    name: "María López",
    preview: "Te compartí la información que necesitabas.",
    time: "10:32",
    unread: 1,
    countryCode: "MX",
    countryName: "México",
    area: "Recursos Humanos",
    campaign: "Campaña A",
    type: "internal",
    avatar: "",
  },
  {
    id: 103,
    name: "Pedro Gómez",
    preview: "Perfecto, muchas gracias.",
    time: "Ayer",
    unread: 0,
    countryCode: "ES",
    countryName: "España",
    area: "Desarrollo",
    campaign: "Campaña B",
    type: "internal",
    avatar: "",
  },
];