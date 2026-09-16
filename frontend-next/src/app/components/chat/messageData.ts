import type { Message } from "./MessageList";

export const messagesByConversation: Record<
  number,
  Message[]
> = {
  1: [
    {
      id: 1,
      sender: "employee",
      text: "Hola, quería hacer una consulta sobre mi proceso.",
      time: "10:35",
      date: "2026-09-01",
      status: "read",
    },
    {
      id: 2,
      sender: "tyc",
      text: "Claro, cuéntame. Estoy aquí para ayudarte.",
      time: "10:37",
      date: "2026-09-01",
      status: "read",
    },
    {
      id: 3,
      sender: "employee",
      text: "Quería saber si me pueden orientar con una duda.",
      time: "10:42",
      date: "2026-09-01",
    },
  ],

  2: [
    {
      id: 4,
      sender: "employee",
      text: "¿Me pueden ayudar con una duda?",
      time: "09:18",
      date: "2026-09-01",
      status: "delivered",
    },
    {
      id: 5,
      sender: "tyc",
      text: "Claro. Explícame qué necesitas.",
      time: "09:21",
      date: "2026-09-01",
      status: "delivered",
    },
  ],

  3: [
    {
      id: 6,
      sender: "employee",
      text: "Gracias por la atención.",
      time: "09:18",
      date: "2026-08-31",
      status: "sent",
    },
    {
      id: 7,
      sender: "tyc",
      text: "Con gusto.",
      time: "09:20",
      date: "2026-08-31",
      status: "sent",
    },
  ],
};

export const internalMessagesByConversation: Record<
  number,
  Message[]
> = {
  101: [
    {
      id: 1011,
      sender: "employee",
      text: "Hola, ¿me puedes ayudar con una consulta?",
      time: "11:02",
      date: "2026-09-08",
      status: "read",
    },
    {
      id: 1012,
      sender: "tyc",
      text: "Claro, dime qué necesitas.",
      time: "11:04",
      date: "2026-09-08",
      status: "read",
    },
    {
      id: 1013,
      sender: "employee",
      text: "Quería confirmar la información de mi campaña.",
      time: "11:05",
      date: "2026-09-08",
      status: "sent",
    },
  ],

  102: [
    {
      id: 1021,
      sender: "employee",
      text: "Hola María, te envié la información.",
      time: "10:25",
      date: "2026-09-08",
      status: "delivered",
    },
    {
      id: 1022,
      sender: "tyc",
      text: "Perfecto, muchas gracias.",
      time: "10:32",
      date: "2026-09-08",
      status: "delivered",
    },
  ],

  103: [
    {
      id: 1031,
      sender: "employee",
      text: "¿Ya tenemos confirmación?",
      time: "16:18",
      date: "2026-09-07",
      status: "read",
    },
    {
      id: 1032,
      sender: "tyc",
      text: "Sí, quedó confirmado.",
      time: "16:25",
      date: "2026-09-07",
      status: "read",
    },
  ],
};