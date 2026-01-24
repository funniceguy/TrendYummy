// Jules API Types
export interface Session {
  name: string;
  id: string;
  title: string;
  prompt: string;
  state: SessionState;
  createTime: string;
  updateTime: string;
  url: string;
}

export type SessionState =
  | "QUEUED"
  | "PLANNING"
  | "PLAN_REVIEW"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  content?: {
    plan?: Plan;
    message?: string;
    error?: ErrorDetails;
  };
}

export type ActivityType =
  | "PLAN_GENERATED"
  | "MESSAGE"
  | "EXECUTION_COMPLETE"
  | "ERROR"
  | "PLAN_APPROVED";

export interface Plan {
  steps: PlanStep[];
  summary?: string;
}

export interface PlanStep {
  description: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
}

export interface ErrorDetails {
  code: string;
  message: string;
}

export interface CreateSessionParams {
  prompt: string;
  title?: string;
  sourceContext: {
    source: string;
    githubRepoContext?: {
      startingBranch: string;
    };
  };
  requirePlanApproval?: boolean;
  automationMode?: "AUTO_CREATE_PR" | "MANUAL";
}

// Fortune Content Types
export interface FortuneRequest {
  zodiacSign: string;
  birthDate?: string;
  category: "daily" | "love" | "money" | "career";
  style: "traditional" | "modern" | "humorous";
}

export interface FortuneContent {
  id: string;
  title: string;
  zodiacSign: string;
  category: string;
  fortune: string;
  luckyNumber: number;
  luckyColor: string;
  advice: string;
  createdAt: string;
}
