import { julesApi } from "@/lib/api/jules-client";
import {
  type CrawlerAnomaly,
  type CrawlHealthCheck,
  type JulesVerificationCard,
  normalizeVerificationState,
  stateToLabel,
  stateToProgress,
  toVerificationActivities,
  upsertVerificationCard,
} from "@/lib/jules-verification-store";
import type { Session } from "@/types/jules";

interface InternalCrawlCheckConfig {
  id: CrawlHealthCheck["id"];
  label: string;
  endpoint: string;
  minItemCount: number;
}

const CRAWL_CHECKS: InternalCrawlCheckConfig[] = [
  { id: "trends", label: "Trends crawler", endpoint: "/api/trends", minItemCount: 20 },
  { id: "youtube", label: "YouTube crawler", endpoint: "/api/youtube", minItemCount: 5 },
  { id: "humor", label: "Humor crawler", endpoint: "/api/humor", minItemCount: 5 },
];

export interface CrawlerHealthSnapshot {
  checkedAt: string;
  checks: CrawlHealthCheck[];
  anomalies: CrawlerAnomaly[];
  anomalyDetected: boolean;
  summary: string;
  passCount: number;
  totalCount: number;
}

function normalizeBasePath(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function getRequestOrigin(request: Request): string {
  const fromUrl = new URL(request.url).origin;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return fromUrl;
}

function buildInternalApiUrl(request: Request, endpoint: string): string {
  const origin = getRequestOrigin(request);
  const basePath = normalizeBasePath(
    process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH,
  );
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${origin}${basePath}${normalizedEndpoint}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function countTrends(payload: unknown): number {
  const record = asRecord(payload);
  const trends = record?.trends;
  return Array.isArray(trends) ? trends.length : 0;
}

function countYoutube(payload: unknown): number {
  const record = asRecord(payload);
  const categories = record?.categories;
  if (!Array.isArray(categories)) {
    return 0;
  }

  let total = 0;
  for (const category of categories) {
    const categoryRecord = asRecord(category);
    const videos = categoryRecord?.videos;
    if (Array.isArray(videos)) {
      total += videos.length;
    }
  }
  return total;
}

function countHumor(payload: unknown): number {
  const record = asRecord(payload);
  const posts = record?.posts;
  return Array.isArray(posts) ? posts.length : 0;
}

function isSuccessPayload(payload: unknown): boolean {
  const record = asRecord(payload);
  return record?.success === true;
}

function countByCheckId(id: CrawlHealthCheck["id"], payload: unknown): number {
  if (id === "trends") {
    return countTrends(payload);
  }
  if (id === "youtube") {
    return countYoutube(payload);
  }
  return countHumor(payload);
}

function createAnomaly(params: {
  checkId: CrawlHealthCheck["id"];
  severity: "warning" | "critical";
  code: CrawlerAnomaly["code"];
  message: string;
  recommendation: string;
}): CrawlerAnomaly {
  const { checkId, severity, code, message, recommendation } = params;
  return {
    id: `${checkId}-${code}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    checkId,
    severity,
    code,
    message,
    recommendation,
  };
}

export async function runCrawlerHealthChecks(
  request: Request,
): Promise<CrawlerHealthSnapshot> {
  const checks: CrawlHealthCheck[] = [];
  const anomalies: CrawlerAnomaly[] = [];
  const checkedAt = new Date().toISOString();

  for (const config of CRAWL_CHECKS) {
    const endpointUrl = buildInternalApiUrl(request, config.endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpointUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const itemCount = countByCheckId(config.id, payload);
      const success = isSuccessPayload(payload);
      const passed =
        response.ok && success && itemCount >= config.minItemCount;

      if (!response.ok) {
        anomalies.push(
          createAnomaly({
            checkId: config.id,
            severity: "critical",
            code: "HTTP_STATUS_ERROR",
            message: `${config.label} returned HTTP ${response.status}`,
            recommendation: `Check upstream source and network policy for ${config.endpoint}`,
          }),
        );
      }

      if (!success) {
        anomalies.push(
          createAnomaly({
            checkId: config.id,
            severity: "warning",
            code: "PAYLOAD_NOT_SUCCESS",
            message: `${config.label} returned success=false payload`,
            recommendation: "Review parser changes or fallback logic.",
          }),
        );
      }

      if (itemCount < config.minItemCount) {
        anomalies.push(
          createAnomaly({
            checkId: config.id,
            severity: "warning",
            code: "LOW_ITEM_COUNT",
            message: `${config.label} item count is low (${itemCount}/${config.minItemCount})`,
            recommendation: "Inspect selector changes and source structure drift.",
          }),
        );
      }

      checks.push({
        id: config.id,
        label: config.label,
        endpoint: config.endpoint,
        statusCode: response.status,
        itemCount,
        passed,
        checkedAt,
        message: passed
          ? `${config.label} is healthy`
          : `${config.label} failed (success=${String(success)}, count=${itemCount})`,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : "unknown error";
      anomalies.push(
        createAnomaly({
          checkId: config.id,
          severity: "critical",
          code: "REQUEST_FAILED",
          message: `${config.label} request failed: ${message}`,
          recommendation: "Validate DNS, outbound network, and remote source availability.",
        }),
      );
      checks.push({
        id: config.id,
        label: config.label,
        endpoint: config.endpoint,
        statusCode: 0,
        itemCount: 0,
        passed: false,
        checkedAt,
        message: `${config.label} request failed (${message})`,
      });
    }
  }

  const passCount = checks.filter((check) => check.passed).length;
  const summary =
    anomalies.length === 0
      ? `All crawler checks healthy (${passCount}/${checks.length})`
      : `Detected ${anomalies.length} anomalies (${passCount}/${checks.length} healthy)`;

  return {
    checkedAt,
    checks,
    anomalies,
    anomalyDetected: anomalies.length > 0,
    summary,
    passCount,
    totalCount: checks.length,
  };
}

function buildPrompt(params: {
  query: string;
  category: string;
  crawlChecks: CrawlHealthCheck[];
  anomalies: CrawlerAnomaly[];
}): string {
  const { query, category, crawlChecks, anomalies } = params;
  const crawlContext = crawlChecks
    .map(
      (check) =>
        `- ${check.label}: ${check.passed ? "PASS" : "FAIL"} (HTTP ${check.statusCode}, count=${check.itemCount})`,
    )
    .join("\n");

  const anomalyContext =
    anomalies.length > 0
      ? anomalies
          .map(
            (anomaly) =>
              `- [${anomaly.severity.toUpperCase()}] ${anomaly.checkId}/${anomaly.code}: ${anomaly.message} | action: ${anomaly.recommendation}`,
          )
          .join("\n")
      : "- No anomalies detected. Analyze residual risks and blind spots.";

  return [
    `You are Jules. Perform a deep verification analysis for "${query}".`,
    `Category: ${category}`,
    "",
    "System crawler health checks:",
    crawlContext,
    "",
    "Detected anomalies:",
    anomalyContext,
    "",
    "Required output:",
    "1) Explain health of each crawler endpoint.",
    "2) Highlight reliability risks and mitigations.",
    "3) Provide operator checklist for production monitoring.",
    "4) Keep the output concise and actionable.",
  ].join("\n");
}

function normalizeSessionId(session: Session): string {
  if (session.id && session.id.trim().length > 0) {
    return session.id;
  }
  if (session.name.includes("/")) {
    const parts = session.name.split("/");
    return parts[parts.length - 1] ?? session.name;
  }
  return session.name || `session-${Date.now()}`;
}

function buildCardSummary(card: JulesVerificationCard): string {
  const passCount = card.crawlChecks.filter((check) => check.passed).length;
  const anomalyPart = card.anomalyDetected
    ? `Anomalies detected: ${card.anomalies.length}.`
    : "No anomaly detected.";
  return `${card.query}. ${card.crawlSummary}. ${anomalyPart} Session state is ${stateToLabel(
    card.state,
  )}. Passed checks ${passCount}/${card.crawlChecks.length}.`;
}

function buildCardReport(card: JulesVerificationCard): string {
  const crawlLines = card.crawlChecks
    .map((check) => {
      const icon = check.passed ? "[PASS]" : "[FAIL]";
      return `- ${icon} ${check.label}: HTTP ${check.statusCode}, itemCount=${check.itemCount}, message=${check.message}`;
    })
    .join("\n");

  const activityLines =
    card.activities.length > 0
      ? card.activities
          .slice(0, 10)
          .map(
            (activity) =>
              `- [${new Date(activity.timestamp).toLocaleString("ko-KR")}] ${activity.type}: ${activity.message}`,
          )
          .join("\n")
      : "- No activity log yet.";

  const anomalyLines =
    card.anomalies.length > 0
      ? card.anomalies
          .map(
            (anomaly) =>
              `- [${anomaly.severity.toUpperCase()}] ${anomaly.checkId}/${anomaly.code}: ${anomaly.message} -> ${anomaly.recommendation}`,
          )
          .join("\n")
      : "- No anomaly detected.";

  return [
    "# Jules Verification Report",
    "",
    `- Session ID: ${card.sessionId}`,
    `- Query: ${card.query}`,
    `- Category: ${card.category}`,
    `- Jules State: ${stateToLabel(card.state)}`,
    `- Progress: ${card.progress}%`,
    "",
    "## 1) Crawler health checks",
    crawlLines,
    "",
    "## 2) Jules progress logs",
    activityLines,
    "",
    "## 3) Detected anomalies",
    anomalyLines,
    "",
    "## 4) Operational summary",
    `- ${card.crawlSummary}`,
    `- Current session state: ${stateToLabel(card.state)}`,
    `- Latest message: ${card.statusMessage}`,
  ].join("\n");
}

function trimAudioText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 240) {
    return normalized;
  }
  return `${normalized.slice(0, 237)}...`;
}

function toSystemActivity(
  message: string,
): JulesVerificationCard["activities"][number] {
  return {
    id: `system-${Date.now()}`,
    type: "SYSTEM",
    timestamp: new Date().toISOString(),
    message,
  };
}

function sortActivitiesByNewest(
  activities: JulesVerificationCard["activities"],
): JulesVerificationCard["activities"] {
  return [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);
}

export async function createVerificationSession(params: {
  request: Request;
  query: string;
  category: string;
  crawlChecks: CrawlHealthCheck[];
  anomalies: CrawlerAnomaly[];
}): Promise<Session> {
  const source =
    process.env.JULES_SOURCE_CONTEXT || "sources/github/funniceguy/TrendYummy";
  const branch = process.env.JULES_SOURCE_BRANCH || "main";
  const prompt = buildPrompt({
    query: params.query,
    category: params.category,
    crawlChecks: params.crawlChecks,
    anomalies: params.anomalies,
  });

  const session = await julesApi.createSession({
    title: `Verification: ${params.query}`,
    prompt,
    sourceContext: {
      source,
      githubRepoContext: {
        startingBranch: branch,
      },
    },
    requirePlanApproval: false,
    automationMode: "AUTO_CREATE_PR",
  });

  return {
    ...session,
    id: normalizeSessionId(session),
  };
}

export async function refreshVerificationCard(
  card: JulesVerificationCard,
): Promise<JulesVerificationCard> {
  if (card.state === "CREATE_FAILED") {
    return card;
  }

  try {
    const session = await julesApi.getSession(card.sessionId);

    if (session.state === "PLAN_REVIEW") {
      try {
        await julesApi.approvePlan(card.sessionId);
      } catch {
        // Ignore approve failure and continue polling.
      }
    }

    let activities = card.activities;
    let latestActivityMessage = `Session state changed to ${stateToLabel(session.state)}`;
    try {
      const activitiesResponse = await julesApi.listActivities(card.sessionId, {
        pageSize: 30,
      });
      const parsedActivities = toVerificationActivities(activitiesResponse.activities);
      activities = sortActivitiesByNewest(parsedActivities);
      latestActivityMessage =
        activities[0]?.message || latestActivityMessage;
    } catch {
      // Activity history is optional for progress updates.
      activities = sortActivitiesByNewest(card.activities);
    }

    const nextState = normalizeVerificationState(session.state);

    const nextCard: JulesVerificationCard = {
      ...card,
      state: nextState,
      progress: stateToProgress(nextState),
      statusMessage: latestActivityMessage,
      julesUrl: session.url || card.julesUrl,
      updatedAt: new Date().toISOString(),
      activities,
      error: nextState === "FAILED" ? latestActivityMessage : undefined,
    };

    nextCard.reportSummary = buildCardSummary(nextCard);
    nextCard.reportMarkdown = buildCardReport(nextCard);
    nextCard.audioText = trimAudioText(nextCard.reportSummary);
    upsertVerificationCard(nextCard);
    return nextCard;
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync failed";
    const failedCard: JulesVerificationCard = {
      ...card,
      updatedAt: new Date().toISOString(),
      statusMessage: `Session sync failed: ${message}`,
      error: message,
      activities: sortActivitiesByNewest([
        toSystemActivity(`Session sync failed: ${message}`),
        ...card.activities,
      ]),
    };
    failedCard.reportSummary = buildCardSummary(failedCard);
    failedCard.reportMarkdown = buildCardReport(failedCard);
    failedCard.audioText = trimAudioText(failedCard.reportSummary);
    upsertVerificationCard(failedCard);
    return failedCard;
  }
}

export async function refreshVerificationCards(
  cards: JulesVerificationCard[],
): Promise<JulesVerificationCard[]> {
  const refreshed: JulesVerificationCard[] = [];
  for (const card of cards) {
    const nextCard = await refreshVerificationCard(card);
    refreshed.push(nextCard);
  }
  return refreshed;
}

export function hydrateInitialCard(card: JulesVerificationCard): JulesVerificationCard {
  const nextCard: JulesVerificationCard = {
    ...card,
    reportSummary: buildCardSummary(card),
    reportMarkdown: buildCardReport(card),
    audioText: trimAudioText(buildCardSummary(card)),
  };
  upsertVerificationCard(nextCard);
  return nextCard;
}
