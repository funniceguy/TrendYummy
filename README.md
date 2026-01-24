# TrendYummy

> 실시간 인터넷 트렌드를 반영하여 인터랙티브 웹 콘텐츠를 자동 생성 및 배포하는 시스템

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode)
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **AI Services**: Jules API (Pro Plan), Nanobanana (Image Generation)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Jules API Pro Plan account
- Supabase project created
- Redis instance (local or cloud)
- Nanobanana API key

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Configure environment variables
# Edit .env with your API keys and database URLs

# 4. Run development server
# Linux/Mac (recommended)
npm run dev

# Windows
npm run dev:windows

# Or set port directly
PORT=3000 npm run dev

# Note: cross-env is used for cross-platform environment variable support
```

### Project Structure

```
trendyummy/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   ├── components/             # React Components
│   ├── lib/                    # Utility Functions
│   ├── orchestrator/           # Jules Session Orchestration
│   ├── types/                  # TypeScript Definitions
│   ├── hooks/                  # Custom React Hooks
│   ├── stores/                 # Zustand Stores
│   └── styles/                 # Global Styles
├── AGENTS.md                # AI Agent System Guide
├── PLAN.md                  # Implementation Plan
├── TECHSPEC.md              # Technical Specification
├── package.json
├── tsconfig.json
├── next.config.mjs        # Note: Next.js 14.2.35 requires .mjs format
├── postcss.config.js
└── .env                     # Environment variables
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server (Linux/Mac)
npm run dev:windows  # Start development server (Windows)
npm run build        # Build for production
npm start            # Start production server

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e      # Run E2E tests (Playwright)
npm run test:coverage # Run tests with coverage

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors automatically
npm run type-check   # Type check (TypeScript)
```

## Jules Session Management

### Session Pool (Pro Plan)

- **Active Pool**: 최대 15개 세션 동시 실행
- **Waiting Queue**: 최대 85개 세션 대기
- **Total Sessions**: 총 100개 세션 관리

### Session Lifecycle

```
QUEUED → PLANNING → PLAN_REVIEW → IN_PROGRESS → COMPLETED
                                 ↓
                            FAILED
```

## Content Generation Pipeline

| Content Type | Priority | Description |
|-------------|----------|-------------|
| **MBTI Test** | HIGH | 드라마/영화 캐릭터 기반 성격 테스트 |
| **Level Test** | HIGH | 유행어/밈 레벨 테스트 |
| **Compatibility** | MEDIUM | 연예인 궁합, AI 운세 |
| **Webtoon 4-cut** | MEDIUM | 트렌드 기반 4컷 웹툰 |
| **Satire Content** | LOW | 풍자 시, 소설 |

## Documentation

- [AGENTS.md](./AGENTS.md) - AI Agent System Guide
- [PLAN.md](./PLAN.md) - Implementation Plan
- [TECHSPEC.md](./TECHSPEC.md) - Technical Specification

## License

Private

## Contact

TrendYummy Team
