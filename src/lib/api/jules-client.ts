// Jules API Client for TrendYummy
// Base URL: https://jules.googleapis.com/v1alpha

const JULES_API_KEY = process.env.JULES_API_KEY || '';

if (!JULES_API_KEY) {
  console.warn('JULES_API_KEY is not set in environment variables');
}

export interface Session {
  name: string;
  id: string;
  title: string;
  prompt: string;
  state: 'QUEUED' | 'PLANNING' | 'PLAN_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createTime: string;
  updateTime: string;
  url: string;
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
  automationMode?: 'AUTO_CREATE_PR' | 'MANUAL';
}

export interface Activity {
  id: string;
  type: 'PLAN_GENERATED' | 'MESSAGE' | 'EXECUTION_COMPLETE' | 'ERROR' | 'PLAN_APPROVED';
  timestamp: string;
  content?: {
    plan?: any;
    message?: string;
    error?: any;
  };
}

export class JulesApiClient {
  private baseUrl: string = 'https://jules.googleapis.com/v1alpha';

  private toSessionResource(sessionId: string): string {
    return sessionId.startsWith("sessions/") ? sessionId : `sessions/${sessionId}`;
  }

  /**
   * Create a new Jules session
   */
  async createSession(params: CreateSessionParams): Promise<Session> {
    const url = `${this.baseUrl}/sessions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create session: ${error}`);
    }

    const data: Session = await response.json();
    return data;
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    const sessionResource = this.toSessionResource(sessionId);
    const url = `${this.baseUrl}/${sessionResource}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get session: ${error}`);
    }

    const data: Session = await response.json();
    return data;
  }

  /**
   * List all sessions
   */
  async listSessions(params?: { pageSize?: number; pageToken?: string }): Promise<{ sessions: Session[]; nextPageToken?: string }> {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.pageToken) {
      queryParams.append('pageToken', params.pageToken);
    }

    const url = `${this.baseUrl}/sessions?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list sessions: ${error}`);
    }

    const data = await response.json();
    return {
      sessions: data.sessions || [],
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Approve a session plan
   */
  async approvePlan(sessionId: string): Promise<void> {
    const sessionResource = this.toSessionResource(sessionId);
    const url = `${this.baseUrl}/${sessionResource}:approvePlan`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to approve plan: ${error}`);
    }
  }

  /**
   * Send a message to a session
   */
  async sendMessage(sessionId: string, message: string): Promise<void> {
    const sessionResource = this.toSessionResource(sessionId);
    const url = `${this.baseUrl}/${sessionResource}:sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * List activities for a session
   */
  async listActivities(sessionId: string, params?: { pageSize?: number; pageToken?: string }): Promise<{ activities: Activity[]; nextPageToken?: string }> {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.pageToken) {
      queryParams.append('pageToken', params.pageToken);
    }

    const sessionResource = this.toSessionResource(sessionId);
    const url = `${this.baseUrl}/${sessionResource}/activities?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list activities: ${error}`);
    }

    const data = await response.json();
    return {
      activities: data.activities || [],
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * List connected sources (repositories)
   */
  async listSources(): Promise<{ sources: string[] }> {
    const url = `${this.baseUrl}/sources`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': JULES_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list sources: ${error}`);
    }

    const data = await response.json();
    return {
      sources: data.sources || [],
    };
  }
}

// Export singleton instance
export const julesApi = new JulesApiClient();
