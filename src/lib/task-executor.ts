// Task Executor - Jules 세션을 활용한 작업 실행 관리
import type { Session } from "@/types/jules";
import type { TaskExecution, LastExecution } from "@/types/content";
import { getApiPath } from "@/lib/api-path";

export class TaskExecutor {
  private static readonly STORAGE_KEY_PREFIX = "trendyummy_last_execution_";

  /**
   * 유휴 Jules 세션 확인
   */
  static async getIdleSessionCount(): Promise<number> {
    const response = await fetch(getApiPath("/api/sessions?pageSize=30"));
    const data = await response.json();
    const sessions: Session[] = data.sessions || [];

    const activeSessions = sessions.filter((s) =>
      ["QUEUED", "PLANNING", "PLAN_REVIEW", "IN_PROGRESS"].includes(s.state),
    );

    const maxConcurrent = 15; // Pro Plan
    return maxConcurrent - activeSessions.length;
  }

  /**
   * 작업 실행 (Jules 세션 생성)
   */
  static async executeTask(
    taskType: "trend" | "youtube" | "humor" | "fortune",
    params?: Record<string, unknown>,
  ): Promise<TaskExecution> {
    const idleCount = await this.getIdleSessionCount();

    if (idleCount <= 0) {
      throw new Error(
        "사용 가능한 Jules 세션이 없습니다. 잠시 후 다시 시도해주세요.",
      );
    }

    const prompt = this.buildPrompt(taskType, params);
    const title = this.buildTitle(taskType, params);

    // Jules 세션 생성
    const response = await fetch(getApiPath("/api/sessions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        prompt,
        sourceContext: {
          source: "sources/github/funniceguy/TrendYummy",
          githubRepoContext: {
            startingBranch: "main",
          },
        },
        requirePlanApproval: false,
        automationMode: "AUTO_CREATE_PR",
      }),
    });

    if (!response.ok) {
      throw new Error("Jules 세션 생성에 실패했습니다");
    }

    const session: Session = await response.json();

    const execution: TaskExecution = {
      id: session.id,
      taskType,
      sessionId: session.id,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    return execution;
  }

  /**
   * 작업별 프롬프트 생성
   */
  private static buildPrompt(
    taskType: string,
    params?: Record<string, unknown>,
  ): string {
    const today = new Date().toLocaleDateString("ko-KR");

    switch (taskType) {
      case "trend":
        return `
## 최신 트렌드 리포트 생성

오늘 날짜: ${today}

### 목표
한국에서 현재 가장 핫한 트렌드 TOP 10을 조사하고 분석하여 리포트를 생성하세요.

### 조사 범위
1. 네이버 실시간 검색어
2. 구글 트렌드 (한국)
3. 트위터/X 트렌딩 토픽
4. 유튜브 인기 급상승 동영상 키워드
5. 주요 뉴스 사이트 헤드라인

### 출력 형식 (JSON)
\`\`\`json
{
  "generatedAt": "${new Date().toISOString()}",
  "summary": "오늘의 트렌드 요약...",
  "trends": [
    {
      "keyword": "키워드",
      "category": "연예/뉴스/게임/스포츠/기타",
      "trendScore": 85,
      "searchVolume": 150000,
      "growthRate": 250,
      "relatedKeywords": ["관련1", "관련2"],
      "sources": ["네이버", "유튜브"],
      "summary": "이 트렌드에 대한 간단한 설명..."
    }
  ],
  "topCategories": [
    { "category": "연예", "count": 4 },
    { "category": "뉴스", "count": 3 }
  ]
}
\`\`\`

### 요구사항
- 실제 데이터 기반 분석
- 각 트렌드에 대한 간단한 설명 포함
- 카테고리별 분류
- 트렌드 점수 (1-100) 계산
        `.trim();

      case "youtube":
        return `
## 인기 유튜브 동영상 TOP 10

오늘 날짜: ${today}

### 목표
한국에서 현재 가장 인기있는 유튜브 동영상 TOP 10을 조사하세요.

### 조사 범위
- 유튜브 인기 급상승 동영상 (한국)
- 최근 24시간 이내 업로드된 영상 중심
- 다양한 카테고리 (엔터테인먼트, 음악, 게임, 뉴스 등)

### 출력 형식 (JSON)
\`\`\`json
{
  "generatedAt": "${new Date().toISOString()}",
  "summary": "오늘의 인기 동영상 트렌드...",
  "videos": [
    {
      "title": "동영상 제목",
      "channelName": "채널명",
      "thumbnailUrl": "https://...",
      "videoUrl": "https://youtube.com/watch?v=...",
      "viewCount": 1500000,
      "likeCount": 50000,
      "publishedAt": "2026-01-24T10:00:00Z",
      "description": "동영상 설명...",
      "duration": "10:35",
      "category": "엔터테인먼트"
    }
  ],
  "topChannels": [
    { "name": "채널A", "count": 2 }
  ]
}
\`\`\`
        `.trim();

      case "humor":
        return `
## 인기 유머 콘텐츠 TOP 10

오늘 날짜: ${today}

### 목표
한국 주요 커뮤니티에서 가장 인기있는 유머 콘텐츠 TOP 10을 조사하세요.

### 조사 범위
- 인스티즈
- 더쿠
- 디시인사이드 베스트
- 개드립
- 웃긴대학

### 출력 형식 (JSON)
\`\`\`json
{
  "generatedAt": "${new Date().toISOString()}",
  "summary": "오늘의 인기 유머 트렌드...",
  "contents": [
    {
      "title": "게시글 제목",
      "thumbnailUrl": "https://...",
      "sourceUrl": "https://...",
      "sourceSite": "인스티즈",
      "viewCount": 50000,
      "likeCount": 1200,
      "commentCount": 150,
      "publishedAt": "2026-01-24T10:00:00Z",
      "summary": "콘텐츠 간단 요약...",
      "category": "짤/썰/영상/기타"
    }
  ],
  "topSites": [
    { "site": "인스티즈", "count": 3 }
  ]
}
\`\`\`
        `.trim();

      case "fortune":
        const zodiacSign = (params?.zodiacSign as string) || "leo";
        const category = (params?.category as string) || "daily";
        return `
## 오늘의 운세 생성

별자리: ${zodiacSign}
카테고리: ${category}
날짜: ${today}

### 출력 형식 (JSON)
\`\`\`json
{
  "generatedAt": "${new Date().toISOString()}",
  "zodiacSign": "${zodiacSign}",
  "category": "${category}",
  "fortune": "오늘의 운세 메시지 (200-300자)...",
  "luckyNumbers": [7, 14, 21],
  "luckyColor": "파란색",
  "luckyDirection": "동쪽",
  "advice": "오늘의 조언...",
  "compatibleSigns": ["gemini", "libra"],
  "todayScore": 85,
  "weeklyForecast": "이번 주 전망..."
}
\`\`\`
        `.trim();

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * 작업별 제목 생성
   */
  private static buildTitle(
    taskType: string,
    params?: Record<string, unknown>,
  ): string {
    const today = new Date().toLocaleDateString("ko-KR");

    switch (taskType) {
      case "trend":
        return `[트렌드] 최신 트렌드 리포트 - ${today}`;
      case "youtube":
        return `[유튜브] 인기 동영상 TOP 10 - ${today}`;
      case "humor":
        return `[유머] 인기 유머 콘텐츠 - ${today}`;
      case "fortune":
        return `[운세] ${params?.zodiacSign || "leo"} ${params?.category || "daily"} - ${today}`;
      default:
        return `[작업] ${taskType} - ${today}`;
    }
  }

  /**
   * 마지막 실행 결과 저장
   */
  static saveLastExecution(taskType: string, execution: LastExecution): void {
    const key = `${this.STORAGE_KEY_PREFIX}${taskType}`;
    localStorage.setItem(key, JSON.stringify(execution));
  }

  /**
   * 마지막 실행 결과 조회
   */
  static getLastExecution(taskType: string): LastExecution | null {
    const key = `${this.STORAGE_KEY_PREFIX}${taskType}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 세션 완료 확인 (폴링)
   */
  static async waitForCompletion(
    sessionId: string,
    onProgress?: (state: string) => void,
  ): Promise<Session> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await fetch(getApiPath(`/api/sessions/${sessionId}`));
          const session: Session = await response.json();

          if (onProgress) {
            onProgress(session.state);
          }

          if (session.state === "COMPLETED") {
            resolve(session);
          } else if (session.state === "FAILED") {
            reject(new Error("세션 실행이 실패했습니다"));
          } else {
            // 5초 후 재시도
            setTimeout(poll, 5000);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}
