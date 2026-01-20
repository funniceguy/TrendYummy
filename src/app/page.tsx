export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold tracking-tight">
          TrendYummy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          실시간 트렌드 기반 AI 콘텐츠 자동 생성 시스템
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-2">시스템 상태</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jules 세션</span>
                <span className="text-2xl font-bold">0/15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">대기열</span>
                <span className="text-2xl font-bold">0/85</span>
              </div>
            </div>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-2">콘텐츠 생성</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">MBTI 테스트</span>
                <span className="text-lg font-bold">25 세션</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">레벨 테스트</span>
                <span className="text-lg font-bold">20 세션</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">운세/궁합</span>
                <span className="text-lg font-bold">15 세션</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">4컷 웹툰</span>
                <span className="text-lg font-bold">15 세션</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Next.js 14 + TypeScript + Tailwind CSS + Shadcn UI</p>
          <p className="mt-2">Jules Pro Plan (15 concurrent sessions)</p>
        </div>
      </div>
    </main>
  );
}
