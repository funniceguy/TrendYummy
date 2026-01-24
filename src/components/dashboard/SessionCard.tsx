import * as React from "react";

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    state: string;
    createTime: string;
    url: string;
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case "QUEUED":
        return "bg-yellow-500";
      case "PLANNING":
        return "bg-blue-500";
      case "PLAN_REVIEW":
        return "bg-purple-500";
      case "IN_PROGRESS":
        return "bg-green-500";
      case "COMPLETED":
        return "bg-green-600";
      case "FAILED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case "QUEUED":
        return "대기";
      case "PLANNING":
        return "계획 중";
      case "PLAN_REVIEW":
        return "플랜 검토";
      case "IN_PROGRESS":
        return "실행 중";
      case "COMPLETED":
        return "완료";
      case "FAILED":
        return "실패";
      default:
        return state;
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">
          {session.title || "제목 없음"}
        </h3>
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStateColor(session.state)}`}
          >
            {getStateText(session.state)}
          </span>
          <span className="text-sm text-muted-foreground">
            {new Date(session.createTime).toLocaleString("ko-KR")}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">세션 ID</span>
          <span className="font-mono text-xs">
            {session.id.substring(0, 8)}...
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">상태</span>
          <span>{session.state}</span>
        </div>

        <div className="pt-4 border-t">
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
            세션 상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}
