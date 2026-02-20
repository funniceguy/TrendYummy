"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutWithNav } from "@/components/layout/LayoutWithNav";
import type { Session } from "@/types/jules";
import { getApiPath } from "@/lib/api-path";

// 별자리 정보
const ZODIAC_SIGNS = [
  { id: "aries", name: "양자리", icon: "♈", dates: "3/21-4/19" },
  { id: "taurus", name: "황소자리", icon: "♉", dates: "4/20-5/20" },
  { id: "gemini", name: "쌍둥이자리", icon: "♊", dates: "5/21-6/20" },
  { id: "cancer", name: "게자리", icon: "♋", dates: "6/21-7/22" },
  { id: "leo", name: "사자자리", icon: "♌", dates: "7/23-8/22" },
  { id: "virgo", name: "처녀자리", icon: "♍", dates: "8/23-9/22" },
  { id: "libra", name: "천칭자리", icon: "♎", dates: "9/23-10/22" },
  { id: "scorpio", name: "전갈자리", icon: "♏", dates: "10/23-11/21" },
  { id: "sagittarius", name: "사수자리", icon: "♐", dates: "11/22-12/21" },
  { id: "capricorn", name: "염소자리", icon: "♑", dates: "12/22-1/19" },
  { id: "aquarius", name: "물병자리", icon: "♒", dates: "1/20-2/18" },
  { id: "pisces", name: "물고기자리", icon: "♓", dates: "2/19-3/20" },
];

// 띠 정보
const ZODIAC_ANIMALS = [
  { id: "rat", name: "쥐띠", icon: "🐀" },
  { id: "ox", name: "소띠", icon: "🐂" },
  { id: "tiger", name: "호랑이띠", icon: "🐅" },
  { id: "rabbit", name: "토끼띠", icon: "🐇" },
  { id: "dragon", name: "용띠", icon: "🐉" },
  { id: "snake", name: "뱀띠", icon: "🐍" },
  { id: "horse", name: "말띠", icon: "🐴" },
  { id: "sheep", name: "양띠", icon: "🐑" },
  { id: "monkey", name: "원숭이띠", icon: "🐵" },
  { id: "rooster", name: "닭띠", icon: "🐓" },
  { id: "dog", name: "개띠", icon: "🐕" },
  { id: "pig", name: "돼지띠", icon: "🐷" },
];

interface ZodiacFortune {
  id: string;
  name: string;
  icon: string;
  dates: string;
  fortune: {
    overall: number;
    love: number;
    money: number;
    health: number;
    work: number;
    fortune: string;
    advice: string;
    luckyNumber: number;
    luckyColor: string;
    luckyTime: string;
  };
}

interface AnimalFortune {
  id: string;
  name: string;
  icon: string;
  fortune: {
    overall: number;
    love: number;
    money: number;
    health: number;
    work: number;
    fortune: string;
    advice: string;
    luckyNumber: number;
    luckyColor: string;
    compatibleAnimal: string;
    incompatibleAnimal: string;
  };
}

interface Celebrity {
  id: string;
  name: string;
  image: string;
  zodiac: string;
  animal: string;
  gender: string;
}

interface Compatibility {
  score: number;
  zodiacMatch: number;
  animalMatch: number;
  description: string;
  chemistry: string;
  advice: string;
}

type TabType = "zodiac" | "animal" | "compatibility";

export default function FortunePage() {
  const [activeTab, setActiveTab] = useState<TabType>("zodiac");
  const [activeSessionCount, setActiveSessionCount] = useState(0);

  // 별자리 운세 상태
  const [selectedZodiac, setSelectedZodiac] = useState<string>("leo");
  const [zodiacFortunes, setZodiacFortunes] = useState<ZodiacFortune[]>([]);
  const [zodiacLoading, setZodiacLoading] = useState(false);

  // 띠별 운세 상태
  const [selectedAnimal, setSelectedAnimal] = useState<string>("dragon");
  const [animalFortunes, setAnimalFortunes] = useState<AnimalFortune[]>([]);
  const [animalLoading, setAnimalLoading] = useState(false);

  // 궁합 상태
  const [userZodiac, setUserZodiac] = useState<string>("leo");
  const [userAnimal, setUserAnimal] = useState<string>("dragon");
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(
    null,
  );
  const [compatibility, setCompatibility] = useState<Compatibility | null>(
    null,
  );
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const compatibilityLockRef = useRef(false);

  const fetchActiveSessionCount = useCallback(async () => {
    try {
      const response = await fetch(getApiPath("/api/sessions?pageSize=30"));
      const data = await response.json();
      const sessions: Session[] = data.sessions || [];
      const activeCount = sessions.filter((s) =>
        ["QUEUED", "PLANNING", "PLAN_REVIEW", "IN_PROGRESS"].includes(s.state),
      ).length;
      setActiveSessionCount(activeCount);
    } catch (err) {
      console.error("Failed to fetch active sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessionCount();
    const interval = setInterval(fetchActiveSessionCount, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveSessionCount]);

  // 초기 데이터 로드
  useEffect(() => {
    loadZodiacFortunes();
    loadAnimalFortunes();
    loadCelebrities();
  }, []);

  const loadZodiacFortunes = async () => {
    setZodiacLoading(true);
    try {
      const response = await fetch(getApiPath("/api/fortune?type=zodiac"));
      const data = await response.json();
      if (data.success) {
        setZodiacFortunes(data.fortunes);
      }
    } catch (error) {
      console.error("Failed to load zodiac fortunes:", error);
    } finally {
      setZodiacLoading(false);
    }
  };

  const loadAnimalFortunes = async () => {
    setAnimalLoading(true);
    try {
      const response = await fetch(getApiPath("/api/fortune?type=animal"));
      const data = await response.json();
      if (data.success) {
        setAnimalFortunes(data.fortunes);
      }
    } catch (error) {
      console.error("Failed to load animal fortunes:", error);
    } finally {
      setAnimalLoading(false);
    }
  };

  const loadCelebrities = async () => {
    try {
      const response = await fetch(getApiPath("/api/fortune"));
      const data = await response.json();
      if (data.celebrities) {
        setCelebrities(data.celebrities);
      }
    } catch (error) {
      console.error("Failed to load celebrities:", error);
    }
  };

  const checkCompatibility = async (celebrity?: Celebrity) => {
    if (compatibilityLockRef.current) {
      return;
    }

    compatibilityLockRef.current = true;
    setCompatibilityLoading(true);
    try {
      const celebId = celebrity?.id || "";
      const response = await fetch(
        getApiPath(
          `/api/fortune?type=compatibility&userZodiac=${userZodiac}&userAnimal=${userAnimal}&celebrity=${celebId}`,
        ),
      );
      const data = await response.json();
      if (data.success) {
        setSelectedCelebrity(data.celebrity);
        setCompatibility(data.compatibility);
      }
    } catch (error) {
      console.error("Failed to check compatibility:", error);
    } finally {
      setCompatibilityLoading(false);
      compatibilityLockRef.current = false;
    }
  };

  const getRandomCelebrity = () => {
    checkCompatibility();
  };

  const selectedZodiacFortune = zodiacFortunes.find(
    (f) => f.id === selectedZodiac,
  );
  const selectedAnimalFortune = animalFortunes.find(
    (f) => f.id === selectedAnimal,
  );

  return (
    <LayoutWithNav activeSessionCount={activeSessionCount}>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-2">
              <span>🔮</span>
              오늘의 운세
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab("zodiac")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "zodiac"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <span>⭐</span>
                <span>별자리 운세</span>
              </button>
              <button
                onClick={() => setActiveTab("animal")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "animal"
                    ? "bg-amber-500 text-white shadow-lg"
                    : "bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <span>🐲</span>
                <span>띠별 운세</span>
              </button>
              <button
                onClick={() => setActiveTab("compatibility")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "compatibility"
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <span>💕</span>
                <span>연예인 궁합</span>
              </button>
            </div>
          </div>

          {/* 별자리 운세 탭 */}
          {activeTab === "zodiac" && (
            <div className="space-y-6">
              {/* 별자리 선택 */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  나의 별자리를 선택하세요
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {ZODIAC_SIGNS.map((sign) => (
                    <button
                      key={sign.id}
                      onClick={() => setSelectedZodiac(sign.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedZodiac === sign.id
                          ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500"
                          : "border-border hover:border-purple-500/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{sign.icon}</div>
                      <div className="text-sm font-medium">{sign.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sign.dates}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 운세 결과 */}
              {zodiacLoading ? (
                <div className="bg-card border rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4 animate-bounce">⭐</div>
                  <p>운세를 불러오는 중...</p>
                </div>
              ) : selectedZodiacFortune ? (
                <ZodiacFortuneCard fortune={selectedZodiacFortune} />
              ) : null}
            </div>
          )}

          {/* 띠별 운세 탭 */}
          {activeTab === "animal" && (
            <div className="space-y-6">
              {/* 띠 선택 */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  나의 띠를 선택하세요
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {ZODIAC_ANIMALS.map((animal) => (
                    <button
                      key={animal.id}
                      onClick={() => setSelectedAnimal(animal.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedAnimal === animal.id
                          ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500"
                          : "border-border hover:border-amber-500/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{animal.icon}</div>
                      <div className="text-sm font-medium">{animal.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 운세 결과 */}
              {animalLoading ? (
                <div className="bg-card border rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4 animate-bounce">🐲</div>
                  <p>운세를 불러오는 중...</p>
                </div>
              ) : selectedAnimalFortune ? (
                <AnimalFortuneCard fortune={selectedAnimalFortune} />
              ) : null}
            </div>
          )}

          {/* 연예인 궁합 탭 */}
          {activeTab === "compatibility" && (
            <div className="space-y-6">
              {/* 내 정보 입력 */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  나의 정보를 입력하세요
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 별자리 선택 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      나의 별자리
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {ZODIAC_SIGNS.map((sign) => (
                        <button
                          key={sign.id}
                          onClick={() => setUserZodiac(sign.id)}
                          disabled={compatibilityLoading}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            userZodiac === sign.id
                              ? "border-pink-500 bg-pink-500/10"
                              : "border-border hover:border-pink-500/50"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="text-lg">{sign.icon}</div>
                          <div className="text-xs">{sign.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 띠 선택 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      나의 띠
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {ZODIAC_ANIMALS.map((animal) => (
                        <button
                          key={animal.id}
                          onClick={() => setUserAnimal(animal.id)}
                          disabled={compatibilityLoading}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            userAnimal === animal.id
                              ? "border-pink-500 bg-pink-500/10"
                              : "border-border hover:border-pink-500/50"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="text-lg">{animal.icon}</div>
                          <div className="text-xs">{animal.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 연예인 선택 */}
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">연예인 선택</h2>
                  {compatibilityLoading && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border border-pink-500/40 bg-pink-500/10 text-pink-400">
                      궁합 계산 중...
                    </span>
                  )}
                  <button
                    onClick={getRandomCelebrity}
                    disabled={compatibilityLoading}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    🎲 랜덤 선택
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {celebrities.map((celeb) => (
                    <button
                      key={celeb.id}
                      onClick={() => checkCompatibility(celeb)}
                      disabled={compatibilityLoading}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedCelebrity?.id === celeb.id
                          ? "border-pink-500 bg-pink-500/10 ring-2 ring-pink-500"
                          : "border-border hover:border-pink-500/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-2xl mb-1">{celeb.image}</div>
                      <div className="text-xs font-medium truncate">
                        {celeb.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 궁합 결과 */}
              {compatibilityLoading ? (
                <div className="bg-card border rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4 animate-bounce">💕</div>
                  <p>궁합을 계산하는 중...</p>
                </div>
              ) : compatibility && selectedCelebrity ? (
                <CompatibilityCard
                  celebrity={selectedCelebrity}
                  compatibility={compatibility}
                  userZodiac={ZODIAC_SIGNS.find((z) => z.id === userZodiac)}
                  userAnimal={ZODIAC_ANIMALS.find((a) => a.id === userAnimal)}
                />
              ) : (
                <div className="bg-card border rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4">💕</div>
                  <h3 className="text-xl font-semibold mb-2">
                    연예인을 선택해주세요
                  </h3>
                  <p className="text-muted-foreground">
                    위에서 연예인을 선택하거나 랜덤 버튼을 클릭하세요
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutWithNav>
  );
}

// 별자리 운세 카드
function ZodiacFortuneCard({ fortune }: { fortune: ZodiacFortune }) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">{fortune.icon}</div>
        <h2 className="text-3xl font-bold mb-2">{fortune.name}</h2>
        <p className="text-muted-foreground mb-4">{fortune.dates}</p>
        <div className="inline-flex items-center gap-2 bg-purple-500/20 px-6 py-3 rounded-full">
          <span className="text-2xl">⭐</span>
          <span className="text-2xl font-bold">{fortune.fortune.overall}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
      </div>

      {/* 점수 그래프 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="연애운"
          score={fortune.fortune.love}
          icon="💕"
          color="pink"
        />
        <ScoreCard
          label="금전운"
          score={fortune.fortune.money}
          icon="💰"
          color="yellow"
        />
        <ScoreCard
          label="건강운"
          score={fortune.fortune.health}
          icon="💪"
          color="green"
        />
        <ScoreCard
          label="직장운"
          score={fortune.fortune.work}
          icon="💼"
          color="blue"
        />
      </div>

      {/* 오늘의 운세 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📖 오늘의 운세</h3>
        <p className="text-lg leading-relaxed">{fortune.fortune.fortune}</p>
      </div>

      {/* 행운 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-muted-foreground mb-2">행운의 숫자</div>
          <div className="text-2xl font-bold">
            {fortune.fortune.luckyNumber}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎨</div>
          <div className="text-sm text-muted-foreground mb-2">행운의 색상</div>
          <div className="text-2xl font-bold">{fortune.fortune.luckyColor}</div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <div className="text-sm text-muted-foreground mb-2">행운의 시간</div>
          <div className="text-2xl font-bold">{fortune.fortune.luckyTime}</div>
        </div>
      </div>

      {/* 조언 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">💡 오늘의 조언</h3>
        <p className="text-lg">{fortune.fortune.advice}</p>
      </div>
    </div>
  );
}

// 띠별 운세 카드
function AnimalFortuneCard({ fortune }: { fortune: AnimalFortune }) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">{fortune.icon}</div>
        <h2 className="text-3xl font-bold mb-2">{fortune.name}</h2>
        <div className="inline-flex items-center gap-2 bg-amber-500/20 px-6 py-3 rounded-full">
          <span className="text-2xl">🐲</span>
          <span className="text-2xl font-bold">{fortune.fortune.overall}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
      </div>

      {/* 점수 그래프 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="연애운"
          score={fortune.fortune.love}
          icon="💕"
          color="pink"
        />
        <ScoreCard
          label="금전운"
          score={fortune.fortune.money}
          icon="💰"
          color="yellow"
        />
        <ScoreCard
          label="건강운"
          score={fortune.fortune.health}
          icon="💪"
          color="green"
        />
        <ScoreCard
          label="직장운"
          score={fortune.fortune.work}
          icon="💼"
          color="blue"
        />
      </div>

      {/* 오늘의 운세 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📖 오늘의 운세</h3>
        <p className="text-lg leading-relaxed">{fortune.fortune.fortune}</p>
      </div>

      {/* 행운 정보 + 궁합 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-muted-foreground mb-2">행운의 숫자</div>
          <div className="text-2xl font-bold">
            {fortune.fortune.luckyNumber}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎨</div>
          <div className="text-sm text-muted-foreground mb-2">행운의 색상</div>
          <div className="text-2xl font-bold">{fortune.fortune.luckyColor}</div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center bg-green-500/5 border-green-500/30">
          <div className="text-3xl mb-2">💚</div>
          <div className="text-sm text-muted-foreground mb-2">잘 맞는 띠</div>
          <div className="text-xl font-bold text-green-500">
            {fortune.fortune.compatibleAnimal}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center bg-red-500/5 border-red-500/30">
          <div className="text-3xl mb-2">💔</div>
          <div className="text-sm text-muted-foreground mb-2">조심할 띠</div>
          <div className="text-xl font-bold text-red-500">
            {fortune.fortune.incompatibleAnimal}
          </div>
        </div>
      </div>

      {/* 조언 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">💡 오늘의 조언</h3>
        <p className="text-lg">{fortune.fortune.advice}</p>
      </div>
    </div>
  );
}

// 궁합 카드
function CompatibilityCard({
  celebrity,
  compatibility,
  userZodiac,
  userAnimal,
}: {
  celebrity: Celebrity;
  compatibility: Compatibility;
  userZodiac?: { id: string; name: string; icon: string };
  userAnimal?: { id: string; name: string; icon: string };
}) {
  const celebZodiac = ZODIAC_SIGNS.find((z) => z.id === celebrity.zodiac);
  const celebAnimal = ZODIAC_ANIMALS.find((a) => a.id === celebrity.animal);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/30 rounded-lg p-8">
        <div className="flex items-center justify-center gap-8">
          {/* 나 */}
          <div className="text-center">
            <div className="text-4xl mb-2">👤</div>
            <div className="text-lg font-semibold">나</div>
            <div className="flex gap-1 justify-center mt-2">
              <span className="text-xl">{userZodiac?.icon}</span>
              <span className="text-xl">{userAnimal?.icon}</span>
            </div>
          </div>

          {/* 하트 */}
          <div className="text-center">
            <div className="text-5xl animate-pulse">💕</div>
            <div
              className={`text-4xl font-bold mt-2 ${
                compatibility.score >= 80
                  ? "text-pink-500"
                  : compatibility.score >= 60
                    ? "text-orange-500"
                    : "text-gray-500"
              }`}
            >
              {compatibility.score}%
            </div>
          </div>

          {/* 연예인 */}
          <div className="text-center">
            <div className="text-4xl mb-2">{celebrity.image}</div>
            <div className="text-lg font-semibold">{celebrity.name}</div>
            <div className="flex gap-1 justify-center mt-2">
              <span className="text-xl">{celebZodiac?.icon}</span>
              <span className="text-xl">{celebAnimal?.icon}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 점수 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-sm text-muted-foreground mb-2">별자리 궁합</div>
          <div className="text-2xl font-bold">{compatibility.zodiacMatch}%</div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🐲</div>
          <div className="text-sm text-muted-foreground mb-2">띠 궁합</div>
          <div className="text-2xl font-bold">{compatibility.animalMatch}%</div>
        </div>
      </div>

      {/* 케미스트리 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">✨ 케미스트리</h3>
        <p className="text-lg">{compatibility.chemistry}</p>
      </div>

      {/* 설명 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">💕 궁합 분석</h3>
        <p className="text-lg">{compatibility.description}</p>
      </div>

      {/* 조언 */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">💡 궁합 조언</h3>
        <p className="text-lg">{compatibility.advice}</p>
      </div>
    </div>
  );
}

// 점수 카드 컴포넌트
function ScoreCard({
  label,
  score,
  icon,
  color,
}: {
  label: string;
  score: number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    pink: "bg-pink-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <span className="font-bold">{score}</span>
      </div>
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
