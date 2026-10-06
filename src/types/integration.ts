export type IntegrationStatus = "active" | "paused" | "error";
export type IntegrationAssignment = "unassigned" | "round_robin" | "fixed_user";
export type IntegrationEventOutcome =
  | "lead_created"
  | "lead_matched"
  | "message_logged"
  | "status_updated"
  | "ignored"
  | "failed"
  | "processing";

export interface ProviderInfo {
  provider: string;
  name: string;
  description: string;
  category: string;
  available: boolean;
}

interface Ref {
  _id: string;
  name: string;
  code?: string;
  email?: string;
}

export interface IntegrationImportProgress {
  status: "running" | "completed" | "failed";
  processed: number;
  created: number;
  matched: number;
  failed: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}

export interface Integration {
  _id: string;
  provider: string;
  name: string;
  status: IntegrationStatus;
  credentialsHint: string;
  routing: {
    branch: Ref | null;
    assignment: IntegrationAssignment;
    fixedUser: Ref | null;
  };
  leadDefaults: { sourceLabel: string };
  createLeadOn: { newContact: boolean; messageFromUnknown: boolean };
  stats: {
    leadsCreated: number;
    eventsReceived: number;
    lastEventAt: string | null;
    lastErrorAt: string | null;
    lastError: string | null;
    consecutiveFailures: number;
  };
  import: IntegrationImportProgress | null;
  createdBy: Ref | null;
  createdAt: string;
  updatedAt: string;
  /** Only on the detail response. */
  webhookUrl?: string;
}

export interface IntegrationCredentials {
  apiEndpoint: string;
  token: string;
}

export interface IntegrationRoutingInput {
  branch: string | null;
  assignment: IntegrationAssignment;
  fixedUser: string | null;
}

export interface CreateIntegrationPayload {
  provider: string;
  name: string;
  credentials: IntegrationCredentials;
  routing: IntegrationRoutingInput;
  sourceLabel: string;
  createLeadOn: { newContact: boolean; messageFromUnknown: boolean };
}

export type UpdateIntegrationPayload = Partial<Omit<CreateIntegrationPayload, "provider">>;

export interface IntegrationEvent {
  _id: string;
  eventType: string;
  externalEventId: string;
  payload: Record<string, unknown>;
  outcome: IntegrationEventOutcome;
  lead: { _id: string; name: string; phoneCountryCode: string; phone: string } | null;
  error: string | null;
  attempts: number;
  receivedAt: string;
}

// ---------- WhatsApp on a lead ----------

export type LeadMessageStatus = "received" | "pending" | "sent" | "delivered" | "read" | "failed";

export interface LeadMessage {
  _id: string;
  direction: "in" | "out";
  type: string;
  text: string | null;
  templateName: string | null;
  mediaUrl: string | null;
  status: LeadMessageStatus;
  error: string | null;
  sentBy: { _id: string; name: string } | null;
  sentFromProvider: boolean;
  senderName: string | null;
  sentAt: string;
}

export interface LeadConversation {
  integration: { _id: string; name: string; provider: string; status: IntegrationStatus } | null;
  contact: string;
  lastInboundAt: string | null;
  windowClosesAt: string | null;
  windowOpen: boolean;
  messages: LeadMessage[];
  hasMore: boolean;
}

export interface WhatsAppTemplate {
  name: string;
  category: string | null;
  language: string | null;
  body: string | null;
  params: string[];
}

export type SendLeadMessagePayload =
  | { type: "text"; text: string }
  | {
      type: "template";
      templateName: string;
      templateBody?: string | null;
      params: { name: string; value: string }[];
    };

// ---------- Notifications ----------

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}
