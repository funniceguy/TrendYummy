import { getApiPath } from "@/lib/api-path";

export interface AgentSession {
    id: string;
    status: 'idle' | 'analyzing' | 'generating_visuals' | 'planning';
    task?: string;
}

export interface DeepResearchResult {
    id: string;
    query: string;
    markdownReport: string;
    visualContent?: {
        type: 'mindmap' | 'infographic';
        content: string; // Mermaid code or Image URL
    };
    sourceCount: number;
    analysisTime: number;
    timestamp: string;
}

// API 응답 타입
interface AnalysisApiResponse {
    success: boolean;
    keyword: string;
    category: string;
    news: {
        title: string;
        description: string;
        link: string;
        pubDate?: string;
        source?: string;
    }[];
    relatedSearches: string[];
    crawledAt: string;
    error?: string;
}

// Mock session pool
let sessions: AgentSession[] = Array.from({ length: 5 }, (_, i) => ({
    id: `session-${i + 1}`,
    status: 'idle'
}));

// 실제 뉴스 데이터 기반 마인드맵 생성
const generateMindMap = (query: string, news: AnalysisApiResponse['news'], relatedSearches: string[]) => {
    // 최대 3개 뉴스 제목을 노드로 사용
    const newsNodes = news.slice(0, 3);
    // 최대 3개 연관 검색어를 노드로 사용
    const relatedNodes = relatedSearches.slice(0, 3);

    // Mermaid에서 특수문자 제거
    const sanitize = (s: string) => s.replace(/["'\[\](){}|<>&]/g, '').substring(0, 25);

    let mermaid = `graph TD\n    Root["${sanitize(query)}"]`;

    // 뉴스 브랜치
    mermaid += `\n    Root --> NEWS("📰 관련 뉴스")`;
    newsNodes.forEach((n, i) => {
        mermaid += `\n    NEWS --> N${i}("${sanitize(n.title)}")`;
    });

    // 연관 검색어 브랜치
    if (relatedNodes.length > 0) {
        mermaid += `\n    Root --> REL("🔍 연관 키워드")`;
        relatedNodes.forEach((r, i) => {
            mermaid += `\n    REL --> R${i}("${sanitize(r)}")`;
        });
    }

    // 출처 브랜치
    const sources = [...new Set(news.map(n => n.source).filter(Boolean))].slice(0, 3);
    if (sources.length > 0) {
        mermaid += `\n    Root --> SRC("📡 출처")`;
        sources.forEach((s, i) => {
            mermaid += `\n    SRC --> S${i}("${sanitize(s || '')}")`;
        });
    }

    mermaid += `
    style Root fill:#f9f,stroke:#333,stroke-width:4px
    style NEWS fill:#bbf,stroke:#333,stroke-width:2px
    style REL fill:#bfb,stroke:#333,stroke-width:2px
    style SRC fill:#fbb,stroke:#333,stroke-width:2px`;

    return mermaid;
};

// 실제 뉴스 데이터 기반 리포트 생성
const generateReport = (
    query: string,
    category: string,
    sessionId: string,
    data: AnalysisApiResponse,
) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newsSection = data.news.length > 0
        ? data.news.map((n, i) => {
            const desc = n.description ? `  ${n.description.substring(0, 120)}...` : '';
            const src = n.source ? ` (${n.source})` : '';
            return `${i + 1}. **${n.title}**${src}\n${desc}\n   🔗 [기사 원문](${n.link})`;
        }).join('\n\n')
        : '- 관련 뉴스를 찾지 못했습니다.';

    const relatedSection = data.relatedSearches.length > 0
        ? data.relatedSearches.slice(0, 8).map(r => `\`${r}\``).join(' · ')
        : '연관 검색어 없음';

    const sourceCount = data.news.length;
    const uniqueSources = [...new Set(data.news.map(n => n.source).filter(Boolean))];

    return `
# 🧠 줄스 심층 분석: ${query}

> 📅 ${dateStr} | 📊 카테고리: ${category} | 🤖 Session ${sessionId}

---

## 1. 개요

**"${query}"**에 대한 네이버 뉴스 및 실시간 검색 데이터를 기반으로 수집한 분석 리포트입니다.
총 **${sourceCount}건**의 관련 기사를 수집하였으며, ${uniqueSources.length > 0 ? `주요 출처는 ${uniqueSources.slice(0, 5).join(', ')} 입니다.` : '다양한 출처에서 수집되었습니다.'}

## 2. 관련 뉴스 기사

${newsSection}

## 3. 연관 검색어

${relatedSection}

## 4. 종합 분석

- 수집된 **${sourceCount}건**의 뉴스 기사를 바탕으로, **"${query}"**는 현재 활발히 보도되고 있는 이슈입니다.
${data.relatedSearches.length > 0 ? `- 연관 검색어 분석 결과, **${data.relatedSearches.slice(0, 3).join('**, **')}** 등의 키워드와 함께 검색되고 있습니다.` : ''}
- 카테고리 **${category}** 분야에서 주요 트렌드로 부상 중입니다.

## 5. 참조 링크

- 🔍 [네이버 뉴스 검색 결과](https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)})
- 🔍 [네이버 통합 검색](https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(query)})
- 📊 [구글 트렌드](https://trends.google.co.kr/trends/explore?q=${encodeURIComponent(query)}&geo=KR)

---
*� 데이터 소스: 네이버 뉴스, 네이버 연관검색어, 구글 트렌드 | Generated by Jules Agent*
`;
};

export const JulesAgentService = {
    // Get current status of all sessions
    getSessionStatus: () => {
        const active = sessions.filter(s => s.status !== 'idle').length;
        const idle = sessions.filter(s => s.status === 'idle').length;
        const total = sessions.length;
        return {
            total,
            active,
            idle,
            available: idle,
            details: sessions
        };
    },

    // 분석 실행 (비동기 — 콜백 패턴)
    analyze: async (query: string, type: 'trend' | 'manual' = 'manual', category: string = '기타'): Promise<DeepResearchResult> => {
        const startTime = Date.now();

        // 1. 세션 할당
        const idleSession = sessions.find(s => s.status === 'idle');
        if (!idleSession) {
            throw new Error("모든 Jules 에이전트가 현재 작업 중입니다. 잠시 후 다시 시도해주세요.");
        }

        idleSession.status = 'planning';
        idleSession.task = query;
        console.log(`[Jules] Session ${idleSession.id} assigned to: ${query} (${type}, category: ${category})`);

        try {
            // 2. 실제 뉴스 데이터 수집
            idleSession.status = 'analyzing';
            const response = await fetch(getApiPath(`/api/analyze?keyword=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`), {
                cache: 'no-store',
            });

            let apiData: AnalysisApiResponse;

            if (response.ok) {
                apiData = await response.json();
            } else {
                // API 실패 시 최소 데이터로 진행
                apiData = {
                    success: false,
                    keyword: query,
                    category,
                    news: [],
                    relatedSearches: [],
                    crawledAt: new Date().toISOString(),
                };
            }

            // 3. 시각화 생성
            idleSession.status = 'generating_visuals';
            const mindMap = generateMindMap(query, apiData.news, apiData.relatedSearches);

            const elapsed = (Date.now() - startTime) / 1000;

            return {
                id: Math.random().toString(36).substr(2, 9),
                query,
                markdownReport: generateReport(query, category, idleSession.id, apiData),
                visualContent: {
                    type: 'mindmap',
                    content: mindMap
                },
                sourceCount: apiData.news.length,
                analysisTime: parseFloat(elapsed.toFixed(1)),
                timestamp: new Date().toISOString()
            };
        } finally {
            // 4. 세션 해제
            idleSession.status = 'idle';
            idleSession.task = undefined;
        }
    }
};
