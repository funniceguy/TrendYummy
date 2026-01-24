import * as React from "react";

interface Task {
  id: string;
  goalTitle: string;
  category: string;
  status: string;
  priority: number;
  createdAt: string;
}

interface TaskQueueItemProps {
  task: Task;
}

export function TaskQueueItem({ task }: TaskQueueItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-500";
      case "queued":
        return "bg-blue-500";
      case "in_progress":
        return "bg-green-500";
      case "plan_review":
        return "bg-purple-500";
      case "completed":
        return "bg-green-600";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "대기";
      case "queued":
        return "대기열";
      case "in_progress":
        return "실행 중";
      case "plan_review":
        return "플랜 검토";
      case "completed":
        return "완료";
      case "failed":
        return "실패";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 7) {
      return "text-red-500";
    } else if (priority >= 5) {
      return "text-orange-500";
    } else {
      return "text-green-500";
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{task.goalTitle}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
        >
          우선순위 {task.priority}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">카테고리</span>
          <span className="text-sm">{task.category}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">상태</span>
          <span className={`text-sm ${getStatusColor(task.status)}`}>
            {getStatusText(task.status)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">생성 시간</span>
          <span className="text-sm text-muted-foreground">
            {new Date(task.createdAt).toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );
}
