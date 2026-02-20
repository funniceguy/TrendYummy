import type { Activity, Session, SessionState } from "@/types/jules";

export const MAX_VERIFICATION_SESSIONS = 15;

export type VerificationState = SessionState | "CREATE_FAILED";

export type VerificationActivityType =
  | "PLAN_GENERATED"
  | "MESSAGE"
  | "EXECUTION_COMPLETE"
  | "ERROR"
  | "PLAN_APPROVED"
  | "SYSTEM";

export interface VerificationActivity {
  id: string;
  type: VerificationActivityType;
  timestamp: string;
  message: string;
}

export interface CrawlHealthCheck {
  id: "trends" | "youtube" | "humor";
  label: string;
  endpoint: string;
  statusCode: number;
  itemCount: number;
  passed: boolean;
  checkedAt: string;
  message: string;
}

export interface CrawlerAnomaly {
  id: string;
  checkId: CrawlHealthCheck["id"];
  severity: "warning" | "critical";
  code:
    | "HTTP_STATUS_ERROR"
    | "PAYLOAD_NOT_SUCCESS"
    | "LOW_ITEM_COUNT"
    | "REQUEST_FAILED";
  message: string;
  recommendation: string;
}

export interface JulesVerificationCard {
  sessionId: string;
  query: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  state: VerificationState;
  progress: number;
  statusMessage: string;
  julesUrl?: string;
  crawlChecks: CrawlHealthCheck[];
  crawlVerified: boolean;
  crawlSummary: string;
  anomalyDetected: boolean;
  anomalies: CrawlerAnomaly[];
  activities: VerificationActivity[];
  reportMarkdown: string;
  reportSummary: string;
  audioText: string;
  error?: string;
}

export interface VerificationStats {
  maxSessions: number;
  active: number;
  available: number;
  completed: number;
  failed: number;
  totalCards: number;
}

interface VerificationStoreState {
  cardsBySessionId: Record<string, JulesVerificationCard>;
  createdOrder: string[];
}

interface GlobalWithVerificationStore {
  __trendyummyVerificationStore?: VerificationStoreState;
}

const globalRef = globalThis as unknown as GlobalWithVerificationStore;

const store: VerificationStoreState =
  globalRef.__trendyummyVerificationStore ?? {
    cardsBySessionId: {},
    createdOrder: [],
  };

globalRef.__trendyummyVerificationStore = store;

const ACTIVE_STATES: VerificationState[] = [
  "QUEUED",
  "PLANNING",
  "PLAN_REVIEW",
  "IN_PROGRESS",
];

const VALID_STATES: VerificationState[] = [
  "QUEUED",
  "PLANNING",
  "PLAN_REVIEW",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CREATE_FAILED",
];

export function isActiveVerificationState(state: VerificationState): boolean {
  return ACTIVE_STATES.includes(state);
}

export function normalizeVerificationState(
  state: string | undefined | null,
): VerificationState {
  if (!state) {
    return "QUEUED";
  }

  if (VALID_STATES.includes(state as VerificationState)) {
    return state as VerificationState;
  }

  return "QUEUED";
}

export function stateToProgress(state: VerificationState): number {
  switch (state) {
    case "QUEUED":
      return 10;
    case "PLANNING":
      return 30;
    case "PLAN_REVIEW":
      return 45;
    case "IN_PROGRESS":
      return 70;
    case "COMPLETED":
      return 100;
    case "FAILED":
    case "CREATE_FAILED":
      return 100;
    default:
      return 0;
  }
}

export function stateToLabel(state: VerificationState): string {
  switch (state) {
    case "QUEUED":
      return "Queued";
    case "PLANNING":
      return "Planning";
    case "PLAN_REVIEW":
      return "Plan review";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    case "CREATE_FAILED":
      return "Create failed";
    default:
      return "Unknown";
  }
}

function normalizeSessionId(session: Pick<Session, "id" | "name">): string {
  if (session.id && session.id.trim().length > 0) {
    return session.id;
  }

  const name = session.name ?? "";
  if (name.includes("/")) {
    const parts = name.split("/");
    return parts[parts.length - 1] ?? name;
  }

  return name || `session-${Date.now()}`;
}

export function createVerificationCard(params: {
  session: Session;
  query: string;
  category: string;
  crawlChecks: CrawlHealthCheck[];
  crawlSummary: string;
  anomalies?: CrawlerAnomaly[];
}): JulesVerificationCard {
  const { session, query, category, crawlChecks, crawlSummary } = params;
  const anomalies = params.anomalies ?? [];
  const nowIso = new Date().toISOString();
  const sessionId = normalizeSessionId(session);
  const state = normalizeVerificationState(session.state);

  return {
    sessionId,
    query,
    category,
    createdAt: nowIso,
    updatedAt: nowIso,
    state,
    progress: stateToProgress(state),
    statusMessage: stateToLabel(state),
    julesUrl: session.url,
    crawlChecks,
    crawlVerified: crawlChecks.every((check) => check.passed),
    crawlSummary,
    anomalyDetected: anomalies.length > 0,
    anomalies,
    activities: [],
    reportMarkdown: "",
    reportSummary: "",
    audioText: "",
  };
}

export function upsertVerificationCard(card: JulesVerificationCard): void {
  const exists = Boolean(store.cardsBySessionId[card.sessionId]);
  store.cardsBySessionId[card.sessionId] = card;
  if (!exists) {
    store.createdOrder.unshift(card.sessionId);
  }
}

export function getVerificationCard(
  sessionId: string,
): JulesVerificationCard | null {
  return store.cardsBySessionId[sessionId] ?? null;
}

export function getVerificationCards(): JulesVerificationCard[] {
  return store.createdOrder
    .map((sessionId) => store.cardsBySessionId[sessionId])
    .filter((card): card is JulesVerificationCard => Boolean(card));
}

export function removeVerificationCard(sessionId: string): void {
  delete store.cardsBySessionId[sessionId];
  store.createdOrder = store.createdOrder.filter((id) => id !== sessionId);
}

export function trimCardsToMax(maxCards: number): void {
  if (store.createdOrder.length <= maxCards) {
    return;
  }

  const removableIds = [...store.createdOrder]
    .reverse()
    .filter((sessionId) => {
      const card = store.cardsBySessionId[sessionId];
      if (!card) {
        return true;
      }
      return !isActiveVerificationState(card.state);
    });

  for (const sessionId of removableIds) {
    if (store.createdOrder.length <= maxCards) {
      break;
    }
    removeVerificationCard(sessionId);
  }
}

export function getVerificationStats(): VerificationStats {
  const cards = getVerificationCards();

  const active = cards.filter((card) =>
    isActiveVerificationState(card.state),
  ).length;
  const completed = cards.filter((card) => card.state === "COMPLETED").length;
  const failed = cards.filter(
    (card) => card.state === "FAILED" || card.state === "CREATE_FAILED",
  ).length;

  return {
    maxSessions: MAX_VERIFICATION_SESSIONS,
    active,
    available: Math.max(0, MAX_VERIFICATION_SESSIONS - active),
    completed,
    failed,
    totalCards: cards.length,
  };
}

export function buildActivityMessage(activity: Activity): string {
  const contentMessage = activity.content?.message?.trim();
  if (contentMessage) {
    return contentMessage;
  }

  switch (activity.type) {
    case "PLAN_GENERATED":
      return "Execution plan generated.";
    case "PLAN_APPROVED":
      return "Execution plan approved.";
    case "EXECUTION_COMPLETE":
      return "Jules execution completed.";
    case "ERROR":
      return activity.content?.error?.message ?? "Jules execution error.";
    case "MESSAGE":
      return "Message updated.";
    default:
      return "Activity updated.";
  }
}

export function toVerificationActivities(
  activities: Activity[],
): VerificationActivity[] {
  return activities
    .map((activity) => ({
      id: activity.id,
      type: activity.type,
      timestamp: activity.timestamp,
      message: buildActivityMessage(activity),
    }))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}
