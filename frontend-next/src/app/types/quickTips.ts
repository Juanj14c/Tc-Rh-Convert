export type QuickTipAudience =
  | "all"
  | "area"
  | "campaign";

export interface QuickTip {
  id: number;
  title: string;
  message: string;
  audienceType: QuickTipAudience;
  audienceValue: string;
  audienceCountry: string;
  active: boolean;
  createdAt: string;
}