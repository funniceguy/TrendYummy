import * as React from "react";

interface CreateSessionFormProps {
  onCreateSession: (data: {
    goalTitle: string;
    category: string;
    priority: number;
  }) => void;
}

export function CreateSessionForm({ onCreateSession }: CreateSessionFormProps) {
  const [formData, setFormData] = React.useState({
    goalTitle: "",
    category: "mbti_test",
    priority: 5,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      goalTitle: formData.goalTitle,
      category: formData.category,
      priority: formData.priority,
    };

    onCreateSession(data);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <h2 className="text-2xl font-semibold mb-6">Jules 세션 생성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="goalTitle"
            className="block text-sm font-medium text-foreground mb-2"
          >
            제목
          </label>
          <input
            type="text"
            id="goalTitle"
            value={formData.goalTitle}
            onChange={(e) =>
              setFormData({ ...formData, goalTitle: e.target.value })
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring-offset-2"
            placeholder="예: 드라마 캐릭터 MBTI 테스트 생성"
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-foreground mb-2"
          >
            카테고리
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring-offset-2"
          >
            <option value="mbti_test">MBTI 테스트</option>
            <option value="level_test">레벨 테스트</option>
            <option value="compatibility">운세/궁합</option>
            <option value="webtoon_4cut">4컷 웹툰</option>
            <option value="satire">풍자/소설</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-foreground mb-2"
          >
            우선순위 (1-10)
          </label>
          <input
            type="number"
            id="priority"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring-offset-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
        >
          세션 생성
        </button>
      </form>
    </div>
  );
}
