import type { SegmentCriteria } from "./segments";

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  criteria: SegmentCriteria;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentInput {
  name: string;
  description?: string | null;
  criteria: SegmentCriteria;
}

export type CampaignChannel = "email" | "whatsapp" | "promo";
export type CampaignStatus = "draft" | "prepared" | "sent" | "cancelled";

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Borrador",
  prepared: "Preparada",
  sent: "Enviada",
  cancelled: "Cancelada",
};

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  segmentId: string | null;
  subject: string | null;
  body: string | null;
  couponCode: string | null;
  consentRequired: boolean;
  preparedAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  name: string;
  channel: CampaignChannel;
  segmentId?: string | null;
  subject?: string | null;
  body?: string | null;
  couponCode?: string | null;
  consentRequired: boolean;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string | null;
  email: string | null;
  phone: string | null;
  status: "pending" | "sent" | "skipped" | "failed" | "unsubscribed";
  error: string | null;
  createdAt: string;
}
