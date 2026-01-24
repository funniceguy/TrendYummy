"use client";

import { useState } from "react";
import type { FortuneRequest } from "@/types/jules";

interface FortuneFormProps {
  onSubmit: (data: FortuneRequest) => Promise<void>;
  isSubmitting: boolean;
}

const ZODIAC_SIGNS = [
  { value: "aries", label: "양자리 ♈", dates: "3/21 - 4/19" },
  { value: "taurus", label: "황소자리 ♉", dates: "4/20 - 5/20" },
  { value: "gemini", label: "쌍둥이자리 ♊", dates: "5/21 - 6/20" },
  { value: "cancer", label: "게자리 ♋", dates: "6/21 - 7/22" },
  { value: "leo", label: "사자자리 ♌", dates: "7/23 - 8/22" },
  { value: "virgo", label: "처녀자리 ♍", dates: "8/23 - 9/22" },
  { value: "libra", label: "천칭자리 ♎", dates: "9/23 - 10/22" },
  { value: "scorpio", label: "전갈자리 ♏", dates: "10/23 - 11/21" },
  { value: "sagittarius", label: "사수자리 ♐", dates: "11/22 - 12/21" },
  { value: "capricorn", label: "염소자리 ♑", dates: "12/22 - 1/19" },
  { value: "aquarius", label: "물병자리 ♒", dates: "1/20 - 2/18" },
  { value: "pisces", label: "물고기자리 ♓", dates: "2/19 - 3/20" },
];

const CATEGORIES = [
  { value: "daily", label: "오늘의 운세", icon: "☀️" },
  { value: "love", label: "연애운", icon: "💕" },
  { value: "money", label: "금전운", icon: "💰" },
  { value: "career", label: "직장운", icon: "💼" },
];

const STYLES = [
  {
    value: "traditional",
    label: "전통적",
    description: "고전적인 점성술 스타일",
  },
  { value: "modern", label: "현대적", description: "트렌디하고 친근한 스타일" },
  {
    value: "humorous",
    label: "유머러스",
    description: "재미있고 위트있는 스타일",
  },
];

export function FortuneForm({ onSubmit, isSubmitting }: FortuneFormProps) {
  const [formData, setFormData] = useState<FortuneRequest>({
    zodiacSign: "leo",
    category: "daily",
    style: "modern",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔮</span>
        <div>
          <h2 className="text-2xl font-semibold">운세 콘텐츠 생성</h2>
          <p className="text-sm text-muted-foreground">
            Jules가 AI 운세 콘텐츠를 생성합니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 별자리 선택 */}
        <div>
          <label className="block text-sm font-medium mb-3">별자리 선택</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {ZODIAC_SIGNS.map((sign) => (
              <button
                key={sign.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, zodiacSign: sign.value })
                }
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.zodiacSign === sign.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{sign.label}</div>
                <div className="text-xs text-muted-foreground">
                  {sign.dates}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-medium mb-3">
            운세 카테고리
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    category: cat.value as FortuneRequest["category"],
                  })
                }
                className={`p-4 rounded-lg border text-center transition-all ${
                  formData.category === cat.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-medium text-sm">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 스타일 선택 */}
        <div>
          <label className="block text-sm font-medium mb-3">작성 스타일</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    style: style.value as FortuneRequest["style"],
                  })
                }
                className={`p-4 rounded-lg border text-left transition-all ${
                  formData.style === style.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">{style.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🔄</span>
              Jules 세션 생성 중...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              운세 콘텐츠 생성 시작
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
