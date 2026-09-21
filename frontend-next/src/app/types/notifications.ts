export type NotificationType =
| "evaluation"
| "chat"
| "mural"
| "announcement"
| "system";


export interface AppNotification {
    id: number;
    type : NotificationType;
    title: string;
    message : string;
    createdAt: string;
    read: boolean;
    href?: string;
}