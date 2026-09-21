import type { QuickTip } from "@/types/quickTips";

export const quickTipAreas = [
    "Comercial",
    "Recursos Humanos",
    "BI",
    "Ventas"
];

export const quickTipCampaigns = [
    "WOM",
    "Tigo",
];
export const initialQuickTips : QuickTip[] = [
    {
        id:1,
        title: "Consejo de campaña",
        message:
        "Recuerda validar los datos antes finalizar la gestión",
        audienceType : "campaign",
        audienceValue : "WOM",
        active: true,
        createdAt: new Date().toISOString(),
    },

    {
        id: 2,
        title: "Consejo para Comercial",
        message:
        "Recuerda confirmar la información del cliente antes de cerrar la  gestión",
        audienceType: "area",
        audienceValue: "Comercial",
        active: true,
        createdAt: new Date().toISOString(),

    },
];