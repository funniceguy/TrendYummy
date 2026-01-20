import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrendYummy - AI 콘텐츠 생성 대시보드',
  description: '실시간 트렌드 기반 인터랙티브 웹 콘텐츠 자동 생성 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
