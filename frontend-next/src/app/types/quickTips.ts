export type QuickTipAudience =
|"all"
|"area"
|"campaign"

export interface QuickTip {
    id: number;
    title : string;
    message: string;
    audienceType: QuickTipAudience;
    audienceValue: string;
    active : boolean;
    createdAt: string;
}