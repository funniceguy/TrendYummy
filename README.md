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

## OCI Deployment Notes

If you deploy under a subpath (example: `/trendyummy`), set:

```bash
NEXT_PUBLIC_BASE_PATH=/trendyummy
```

Then rebuild and restart:

```bash
npm run build
npm run start
```

Or run the one-shot deployment script on OCI:

```bash
chmod +x scripts/deploy-oci.sh scripts/health-check.sh
NEXT_PUBLIC_BASE_PATH=/trendyummy APP_NAME=trendyummy ./scripts/deploy-oci.sh
```

Enable continuous health monitoring (auto-restart on failure):

```bash
chmod +x scripts/health-monitor.sh
NEXT_PUBLIC_BASE_PATH=/trendyummy APP_NAME=trendyummy ./scripts/health-monitor.sh
```

Recommended cron setup (every 5 minutes):

```bash
crontab -l > /tmp/current-cron 2>/dev/null || true
echo "*/5 * * * * cd /opt/apps/trendyummy && NEXT_PUBLIC_BASE_PATH=/trendyummy APP_NAME=trendyummy BASE_URL=http://127.0.0.1 ./scripts/health-monitor.sh >> /home/ubuntu/trendyummy-health.log 2>&1" >> /tmp/current-cron
crontab /tmp/current-cron
rm -f /tmp/current-cron
```

Nginx reverse proxy example:

```nginx
location /trendyummy/ {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

For web crawling from OCI, outbound internet access is required:
- Instance subnet must have egress to `0.0.0.0/0`
- Public subnet: Internet Gateway route
- Private subnet: NAT Gateway route
- NSG/Security List egress rule must allow TCP 443 (and DNS if restricted)

## License

Private

## Contact

TrendYummy Team
