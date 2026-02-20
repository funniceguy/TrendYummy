import { getApiPath } from "@/lib/api-path";

export type VerificationState =
  | "QUEUED"
  | "PLANNING"
  | "PLAN_REVIEW"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CREATE_FAILED";

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

export interface CrawlerHealthSnapshot {
  checkedAt: string;
  checks: CrawlHealthCheck[];
  anomalies: CrawlerAnomaly[];
  anomalyDetected: boolean;
  summary: string;
  passCount: number;
  totalCount: number;
}

export interface VerificationActivity {
  id: string;
  type:
    | "PLAN_GENERATED"
    | "MESSAGE"
    | "EXECUTION_COMPLETE"
    | "ERROR"
    | "PLAN_APPROVED"
    | "SYSTEM";
  timestamp: string;
  message: string;
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

export interface SessionStatus {
  total: number;
  active: number;
  idle: number;
  available: number;
  details: Array<{
    sessionId: string;
    query: string;
    state: VerificationState;
    progress: number;
  }>;
}

export interface DeepResearchResult {
  id: string;
  sessionId: string;
  query: string;
  markdownReport: string;
  visualContent?: {
    type: "mindmap" | "infographic";
    content: string;
  };
  sourceCount: number;
  analysisTime: number;
  timestamp: string;
  state: VerificationState;
  crawlChecks: CrawlHealthCheck[];
  crawlVerified: boolean;
  anomalies: CrawlerAnomaly[];
}

interface ListVerificationResponse {
  cards: JulesVerificationCard[];
  stats: VerificationStats;
}

interface CreateVerificationCreatedResponse {
  skipped?: false;
  card: JulesVerificationCard;
  stats: VerificationStats;
  health?: CrawlerHealthSnapshot;
}

interface CreateVerificationSkippedResponse {
  skipped: true;
  reason: string;
  health: CrawlerHealthSnapshot;
  stats: VerificationStats;
}

interface SingleVerificationResponse {
  card: JulesVerificationCard;
  stats: VerificationStats;
}

export type CreateVerificationResult =
  | {
      skipped: false;
      card: JulesVerificationCard;
      stats: VerificationStats;
      health?: CrawlerHealthSnapshot;
    }
  | {
      skipped: true;
      reason: string;
      health: CrawlerHealthSnapshot;
      stats: VerificationStats;
    };

const DEFAULT_STATS: VerificationStats = {
  maxSessions: 15,
  active: 0,
  available: 15,
  completed: 0,
  failed: 0,
  totalCards: 0,
};

const ACTIVE_STATES: VerificationState[] = [
  "QUEUED",
  "PLANNING",
  "PLAN_REVIEW",
  "IN_PROGRESS",
];

const POLL_INTERVAL_MS = 3000;
const ANALYZE_TIMEOUT_MS = 2 * 60 * 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function sanitizeMermaidLabel(input: string): string {
  return input.replace(/["'[\](){}|<>]/g, "").slice(0, 30);
}

function buildVerificationMindmap(card: JulesVerificationCard): string {
  const lines: string[] = [];
  lines.push("graph TD");
  lines.push(`Root["${sanitizeMermaidLabel(card.query)}"]`);
  lines.push(`Root --> State["State: ${sanitizeMermaidLabel(card.state)}"]`);

  card.crawlChecks.forEach((check, index) => {
    const nodeId = `C${index}`;
    const status = check.passed ? "PASS" : "FAIL";
    lines.push(
      `Root --> ${nodeId}["${sanitizeMermaidLabel(check.label)} ${status}"]`,
    );
  });

  card.anomalies.slice(0, 3).forEach((anomaly, index) => {
    const nodeId = `E${index}`;
    lines.push(
      `Root --> ${nodeId}["${sanitizeMermaidLabel(anomaly.checkId)} ${sanitizeMermaidLabel(anomaly.code)}"]`,
    );
  });

  lines.push("style Root fill:#f472b6,stroke:#111827,stroke-width:2px");
  lines.push("style State fill:#60a5fa,stroke:#111827,stroke-width:1px");
  return lines.join("\n");
}

function toDeepResearchResult(card: JulesVerificationCard): DeepResearchResult {
  const createdAtMs = new Date(card.createdAt).getTime();
  const updatedAtMs = new Date(card.updatedAt).getTime();
  const analysisTime = Math.max(0, (updatedAtMs - createdAtMs) / 1000);

  return {
    id: card.sessionId,
    sessionId: card.sessionId,
    query: card.query,
    markdownReport: card.reportMarkdown || card.reportSummary,
    visualContent: {
      type: "mindmap",
      content: buildVerificationMindmap(card),
    },
    sourceCount: card.crawlChecks.length,
    analysisTime: Number(analysisTime.toFixed(1)),
    timestamp: card.updatedAt,
    state: card.state,
    crawlChecks: card.crawlChecks,
    crawlVerified: card.crawlVerified,
    anomalies: card.anomalies,
  };
}

export const JulesAgentService = {
  _cachedCards: [] as JulesVerificationCard[],
  _cachedStats: { ...DEFAULT_STATS } as VerificationStats,

  async listVerificationCards(): Promise<ListVerificationResponse> {
    const response = await fetch(getApiPath("/api/jules-verification"), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to list verification cards: ${response.status}`);
    }

    const data = (await response.json()) as ListVerificationResponse;
    this._cachedCards = data.cards;
    this._cachedStats = data.stats;
    return data;
  },

  async createVerification(
    query: string,
    category: string = "general",
    options?: { force?: boolean },
  ): Promise<CreateVerificationResult> {
    const response = await fetch(getApiPath("/api/jules-verification"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        category,
        force: options?.force === true,
      }),
    });

    if (!response.ok && response.status !== 202) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw new Error(body.error || body.message || "Failed to create verification");
    }

    if (response.status === 202) {
      const skippedData =
        (await response.json()) as CreateVerificationSkippedResponse;
      this._cachedStats = skippedData.stats;
      return {
        skipped: true,
        reason: skippedData.reason,
        health: skippedData.health,
        stats: skippedData.stats,
      };
    }

    const data = (await response.json()) as CreateVerificationCreatedResponse;
    this._cachedStats = data.stats;

    const existingIndex = this._cachedCards.findIndex(
      (card) => card.sessionId === data.card.sessionId,
    );
    if (existingIndex >= 0) {
      const nextCards = [...this._cachedCards];
      nextCards[existingIndex] = data.card;
      this._cachedCards = nextCards;
    } else {
      this._cachedCards = [data.card, ...this._cachedCards];
    }

    return {
      skipped: false,
      card: data.card,
      stats: data.stats,
      health: data.health,
    };
  },

  async getVerificationCard(sessionId: string): Promise<JulesVerificationCard> {
    const response = await fetch(
      getApiPath(`/api/jules-verification/${encodeURIComponent(sessionId)}`),
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get verification card: ${response.status}`);
    }

    const data = (await response.json()) as SingleVerificationResponse;
    this._cachedStats = data.stats;

    const existingIndex = this._cachedCards.findIndex(
      (card) => card.sessionId === data.card.sessionId,
    );
    if (existingIndex >= 0) {
      const nextCards = [...this._cachedCards];
      nextCards[existingIndex] = data.card;
      this._cachedCards = nextCards;
    } else {
      this._cachedCards = [data.card, ...this._cachedCards];
    }

    return data.card;
  },

  async getCrawlerHealth(): Promise<CrawlerHealthSnapshot> {
    const response = await fetch(getApiPath("/api/crawler-health"), {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Failed to load crawler health: ${response.status}`);
    }
    return (await response.json()) as CrawlerHealthSnapshot;
  },

  getAudioUrl(sessionId: string): string {
    return getApiPath(
      `/api/jules-verification/${encodeURIComponent(sessionId)}/audio`,
    );
  },

  getSessionStatus(): SessionStatus {
    const active = this._cachedCards.filter((card) =>
      ACTIVE_STATES.includes(card.state),
    ).length;
    const total = this._cachedStats.maxSessions;
    const available = Math.max(0, total - active);

    return {
      total,
      active,
      idle: available,
      available,
      details: this._cachedCards.slice(0, total).map((card) => ({
        sessionId: card.sessionId,
        query: card.query,
        state: card.state,
        progress: card.progress,
      })),
    };
  },

  async refreshSessionStatus(): Promise<SessionStatus> {
    await this.listVerificationCards();
    return this.getSessionStatus();
  },

  async analyze(
    query: string,
    _type: "trend" | "manual" = "manual",
    category: string = "general",
  ): Promise<DeepResearchResult> {
    const created = await this.createVerification(query, category, {
      force: true,
    });
    if (created.skipped) {
      throw new Error(created.reason);
    }

    const createdCard = created.card;
    const startedAt = Date.now();

    while (Date.now() - startedAt <= ANALYZE_TIMEOUT_MS) {
      const latest = await this.getVerificationCard(createdCard.sessionId);
      if (latest.state === "COMPLETED") {
        return toDeepResearchResult(latest);
      }
      if (latest.state === "FAILED" || latest.state === "CREATE_FAILED") {
        throw new Error(latest.error || "Jules verification failed");
      }
      await wait(POLL_INTERVAL_MS);
    }

    throw new Error("Jules verification timeout");
  },

  toDeepResearchResult(card: JulesVerificationCard): DeepResearchResult {
    return toDeepResearchResult(card);
  },
};
