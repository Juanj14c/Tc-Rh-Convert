import type { AppNotification } from "@/types/notifications";

export const initialNotifications : AppNotification[]=[
    {
        id:1,
        type: "evaluation",
        title: "Evaluación disponible",
        message:
        "Ya puedes realizar tu evaluación correspodiente a tu antigüedad.",
        createdAt: "Hace 10 min",
        read: false,
        href: "/evaluations" 
    },
    {
        id: 2,
        type: "chat",
        title : "Tu consulta fue respodida",
        message: 
        "Talento & Cultrua respondió una consulta que realizaste",
        createdAt: "Hace 1 h",
        read: false,
        href: "/chat",
    },
    {
        id: 3,
        type: "mural",
        title: "Nueva publicación",
        message:
        "Hay una nuyeva publicación disponible para tu área",
        createdAt: "Hace 3 h",
        read : false,
        href: "/mural"
    },
    {
        id: 4,
        type: "announcement",
        title : "Nueva comunicación",
        message:
        "Talento & Cultura publicó una comunicación para todos",
        createdAt: "Ayer",
        read: true,
        href: "/mural",
    },
];