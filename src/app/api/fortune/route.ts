import { NextResponse } from "next/server";

// 별자리 정보
const ZODIAC_SIGNS = [
  {
    id: "aries",
    name: "양자리",
    icon: "♈",
    dates: "3/21-4/19",
    element: "불",
  },
  {
    id: "taurus",
    name: "황소자리",
    icon: "♉",
    dates: "4/20-5/20",
    element: "흙",
  },
  {
    id: "gemini",
    name: "쌍둥이자리",
    icon: "♊",
    dates: "5/21-6/20",
    element: "공기",
  },
  {
    id: "cancer",
    name: "게자리",
    icon: "♋",
    dates: "6/21-7/22",
    element: "물",
  },
  {
    id: "leo",
    name: "사자자리",
    icon: "♌",
    dates: "7/23-8/22",
    element: "불",
  },
  {
    id: "virgo",
    name: "처녀자리",
    icon: "♍",
    dates: "8/23-9/22",
    element: "흙",
  },
  {
    id: "libra",
    name: "천칭자리",
    icon: "♎",
    dates: "9/23-10/22",
    element: "공기",
  },
  {
    id: "scorpio",
    name: "전갈자리",
    icon: "♏",
    dates: "10/23-11/21",
    element: "물",
  },
  {
    id: "sagittarius",
    name: "사수자리",
    icon: "♐",
    dates: "11/22-12/21",
    element: "불",
  },
  {
    id: "capricorn",
    name: "염소자리",
    icon: "♑",
    dates: "12/22-1/19",
    element: "흙",
  },
  {
    id: "aquarius",
    name: "물병자리",
    icon: "♒",
    dates: "1/20-2/18",
    element: "공기",
  },
  {
    id: "pisces",
    name: "물고기자리",
    icon: "♓",
    dates: "2/19-3/20",
    element: "물",
  },
];

// 띠 정보
const ZODIAC_ANIMALS = [
  {
    id: "rat",
    name: "쥐띠",
    icon: "🐀",
    years: [1960, 1972, 1984, 1996, 2008, 2020],
  },
  {
    id: "ox",
    name: "소띠",
    icon: "🐂",
    years: [1961, 1973, 1985, 1997, 2009, 2021],
  },
  {
    id: "tiger",
    name: "호랑이띠",
    icon: "🐅",
    years: [1962, 1974, 1986, 1998, 2010, 2022],
  },
  {
    id: "rabbit",
    name: "토끼띠",
    icon: "🐇",
    years: [1963, 1975, 1987, 1999, 2011, 2023],
  },
  {
    id: "dragon",
    name: "용띠",
    icon: "🐉",
    years: [1964, 1976, 1988, 2000, 2012, 2024],
  },
  {
    id: "snake",
    name: "뱀띠",
    icon: "🐍",
    years: [1965, 1977, 1989, 2001, 2013, 2025],
  },
  {
    id: "horse",
    name: "말띠",
    icon: "🐴",
    years: [1966, 1978, 1990, 2002, 2014, 2026],
  },
  {
    id: "sheep",
    name: "양띠",
    icon: "🐑",
    years: [1967, 1979, 1991, 2003, 2015, 2027],
  },
  {
    id: "monkey",
    name: "원숭이띠",
    icon: "🐵",
    years: [1968, 1980, 1992, 2004, 2016, 2028],
  },
  {
    id: "rooster",
    name: "닭띠",
    icon: "🐓",
    years: [1969, 1981, 1993, 2005, 2017, 2029],
  },
  {
    id: "dog",
    name: "개띠",
    icon: "🐕",
    years: [1970, 1982, 1994, 2006, 2018, 2030],
  },
  {
    id: "pig",
    name: "돼지띠",
    icon: "🐷",
    years: [1971, 1983, 1995, 2007, 2019, 2031],
  },
];

// 인기 연예인 목록
const CELEBRITIES = [
  {
    id: "bts_jimin",
    name: "지민 (BTS)",
    image: "🎤",
    zodiac: "libra",
    animal: "rooster",
    gender: "남",
  },
  {
    id: "bts_v",
    name: "뷔 (BTS)",
    image: "🎤",
    zodiac: "capricorn",
    animal: "rooster",
    gender: "남",
  },
  {
    id: "bts_jungkook",
    name: "정국 (BTS)",
    image: "🎤",
    zodiac: "virgo",
    animal: "pig",
    gender: "남",
  },
  {
    id: "iu",
    name: "아이유",
    image: "🎵",
    zodiac: "taurus",
    animal: "monkey",
    gender: "여",
  },
  {
    id: "jennie",
    name: "제니 (BLACKPINK)",
    image: "💖",
    zodiac: "capricorn",
    animal: "rat",
    gender: "여",
  },
  {
    id: "jisoo",
    name: "지수 (BLACKPINK)",
    image: "💖",
    zodiac: "capricorn",
    animal: "rooster",
    gender: "여",
  },
  {
    id: "lisa",
    name: "리사 (BLACKPINK)",
    image: "💖",
    zodiac: "aries",
    animal: "pig",
    gender: "여",
  },
  {
    id: "rose",
    name: "로제 (BLACKPINK)",
    image: "💖",
    zodiac: "aquarius",
    animal: "pig",
    gender: "여",
  },
  {
    id: "newjeans_hanni",
    name: "하니 (NewJeans)",
    image: "🐰",
    zodiac: "libra",
    animal: "dragon",
    gender: "여",
  },
  {
    id: "newjeans_minji",
    name: "민지 (NewJeans)",
    image: "🐰",
    zodiac: "taurus",
    animal: "dragon",
    gender: "여",
  },
  {
    id: "aespa_karina",
    name: "카리나 (aespa)",
    image: "✨",
    zodiac: "aries",
    animal: "pig",
    gender: "여",
  },
  {
    id: "aespa_winter",
    name: "윈터 (aespa)",
    image: "✨",
    zodiac: "capricorn",
    animal: "pig",
    gender: "여",
  },
  {
    id: "ive_wonyoung",
    name: "장원영 (IVE)",
    image: "🌟",
    zodiac: "virgo",
    animal: "dragon",
    gender: "여",
  },
  {
    id: "ive_yujin",
    name: "안유진 (IVE)",
    image: "🌟",
    zodiac: "virgo",
    animal: "monkey",
    gender: "여",
  },
  {
    id: "son_heungmin",
    name: "손흥민",
    image: "⚽",
    zodiac: "cancer",
    animal: "monkey",
    gender: "남",
  },
  {
    id: "lee_minho",
    name: "이민호",
    image: "🎬",
    zodiac: "cancer",
    animal: "ox",
    gender: "남",
  },
  {
    id: "gong_yoo",
    name: "공유",
    image: "🎬",
    zodiac: "cancer",
    animal: "dog",
    gender: "남",
  },
  {
    id: "song_joongki",
    name: "송중기",
    image: "🎬",
    zodiac: "virgo",
    animal: "ox",
    gender: "남",
  },
  {
    id: "park_bogum",
    name: "박보검",
    image: "🎬",
    zodiac: "gemini",
    animal: "monkey",
    gender: "남",
  },
  {
    id: "hyunbin",
    name: "현빈",
    image: "🎬",
    zodiac: "virgo",
    animal: "tiger",
    gender: "남",
  },
  {
    id: "song_hyekyo",
    name: "송혜교",
    image: "🎬",
    zodiac: "scorpio",
    animal: "tiger",
    gender: "여",
  },
  {
    id: "han_sohee",
    name: "한소희",
    image: "🎬",
    zodiac: "scorpio",
    animal: "rooster",
    gender: "여",
  },
  {
    id: "kim_taeri",
    name: "김태리",
    image: "🎬",
    zodiac: "aries",
    animal: "tiger",
    gender: "여",
  },
  {
    id: "suzy",
    name: "수지",
    image: "🎬",
    zodiac: "libra",
    animal: "dragon",
    gender: "여",
  },
];

// FortuneType - valid fortune request types
type FortuneType = "zodiac" | "animal" | "compatibility";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "zodiac") as FortuneType;
  const id = searchParams.get("id");

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  try {
    if (type === "zodiac") {
      // 별자리 운세
      const fortunes = ZODIAC_SIGNS.map((sign) => ({
        ...sign,
        fortune: generateZodiacFortune(sign.id, dateStr),
      }));

      return NextResponse.json({
        success: true,
        type: "zodiac",
        date: dateStr,
        fortunes: id ? fortunes.filter((f) => f.id === id) : fortunes,
      });
    }

    if (type === "animal") {
      // 띠별 운세
      const fortunes = ZODIAC_ANIMALS.map((animal) => ({
        ...animal,
        fortune: generateAnimalFortune(animal.id, dateStr),
      }));

      return NextResponse.json({
        success: true,
        type: "animal",
        date: dateStr,
        fortunes: id ? fortunes.filter((f) => f.id === id) : fortunes,
      });
    }

    if (type === "compatibility") {
      // 연예인 궁합
      const celebrityId = searchParams.get("celebrity");
      const userZodiac = searchParams.get("userZodiac");
      const userAnimal = searchParams.get("userAnimal");

      let celebrity = CELEBRITIES.find((c) => c.id === celebrityId);
      if (!celebrity) {
        // 랜덤 연예인 선택
        celebrity = CELEBRITIES[Math.floor(Math.random() * CELEBRITIES.length)];
      }

      const compatibility = calculateCompatibility(
        userZodiac || "leo",
        userAnimal || "dragon",
        celebrity,
        dateStr,
      );

      return NextResponse.json({
        success: true,
        type: "compatibility",
        date: dateStr,
        celebrity,
        compatibility,
        allCelebrities: CELEBRITIES,
      });
    }

    return NextResponse.json({
      success: true,
      zodiacSigns: ZODIAC_SIGNS,
      zodiacAnimals: ZODIAC_ANIMALS,
      celebrities: CELEBRITIES,
    });
  } catch (error) {
    console.error("Fortune API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "운세 생성 실패",
      },
      { status: 500 },
    );
  }
}

function generateZodiacFortune(
  zodiacId: string,
  dateStr: string,
): {
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
} {
  // 날짜와 별자리 조합으로 일관된 난수 생성
  const seed = hashCode(zodiacId + dateStr);
  const rng = seededRandom(seed);

  const overall = Math.floor(rng() * 30) + 70; // 70-100
  const love = Math.floor(rng() * 40) + 60;
  const money = Math.floor(rng() * 40) + 60;
  const health = Math.floor(rng() * 40) + 60;
  const work = Math.floor(rng() * 40) + 60;

  const fortunes = [
    "오늘은 새로운 시작을 위한 완벽한 날입니다. 마음먹은 일이 있다면 오늘 시작해보세요.",
    "주변 사람들과의 관계가 더욱 돈독해지는 날입니다. 소중한 사람에게 연락해보세요.",
    "창의력이 빛나는 날입니다. 새로운 아이디어가 떠오르면 메모해두세요.",
    "재정적으로 좋은 소식이 있을 수 있습니다. 기대하지 않았던 곳에서 행운이 찾아올지도.",
    "건강에 신경 쓰기 좋은 날입니다. 가벼운 운동으로 하루를 시작해보세요.",
    "직장에서 인정받을 수 있는 기회가 올 수 있습니다. 최선을 다해주세요.",
    "연인이나 가족과 특별한 시간을 보내기 좋은 날입니다.",
    "오랫동안 고민했던 문제의 해결책을 찾을 수 있는 날입니다.",
    "새로운 인연을 만날 수 있는 날입니다. 열린 마음으로 사람들을 대해보세요.",
    "오늘의 작은 노력이 미래에 큰 결실로 돌아올 것입니다.",
  ];

  const advices = [
    "서두르지 말고 차분하게 일을 처리하세요.",
    "긍정적인 마음가짐이 행운을 부릅니다.",
    "작은 것에도 감사하는 마음을 가지세요.",
    "자신감을 가지고 도전해보세요.",
    "주변 사람들의 조언에 귀를 기울이세요.",
    "오늘은 휴식도 중요합니다. 무리하지 마세요.",
    "새로운 것을 배우기 좋은 날입니다.",
    "과거에 연연하지 말고 앞을 바라보세요.",
    "직감을 믿고 행동해도 좋은 날입니다.",
    "계획을 세우고 차근차근 실행해보세요.",
  ];

  const colors = [
    "빨강",
    "파랑",
    "노랑",
    "초록",
    "보라",
    "주황",
    "분홍",
    "하늘색",
    "금색",
    "은색",
  ];
  const times = [
    "오전 7시",
    "오전 10시",
    "정오",
    "오후 2시",
    "오후 5시",
    "저녁 7시",
    "밤 9시",
  ];

  return {
    overall,
    love,
    money,
    health,
    work,
    fortune: fortunes[Math.floor(rng() * fortunes.length)],
    advice: advices[Math.floor(rng() * advices.length)],
    luckyNumber: Math.floor(rng() * 99) + 1,
    luckyColor: colors[Math.floor(rng() * colors.length)],
    luckyTime: times[Math.floor(rng() * times.length)],
  };
}

function generateAnimalFortune(
  animalId: string,
  dateStr: string,
): {
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
} {
  const seed = hashCode(animalId + dateStr);
  const rng = seededRandom(seed);

  const overall = Math.floor(rng() * 30) + 70;
  const love = Math.floor(rng() * 40) + 60;
  const money = Math.floor(rng() * 40) + 60;
  const health = Math.floor(rng() * 40) + 60;
  const work = Math.floor(rng() * 40) + 60;

  const fortunes = [
    "2026년의 기운이 당신에게 좋은 영향을 미치고 있습니다. 적극적으로 행동하세요.",
    "조상님의 덕을 받는 날입니다. 가족과의 시간을 소중히 하세요.",
    "금전운이 상승하는 시기입니다. 현명한 투자를 고려해보세요.",
    "귀인의 도움을 받을 수 있는 날입니다. 주변을 잘 살펴보세요.",
    "건강을 지키는 것이 재물을 지키는 것입니다. 몸 관리에 신경 쓰세요.",
    "오늘의 인연이 평생을 함께할 수도 있습니다. 새로운 만남에 열려 있으세요.",
    "학업이나 업무에서 좋은 성과를 거둘 수 있는 날입니다.",
    "마음의 평화를 찾기 좋은 날입니다. 명상이나 산책을 해보세요.",
    "오래된 문제가 해결될 조짐이 보입니다. 조금만 더 인내하세요.",
    "새로운 도전을 두려워하지 마세요. 성공이 기다리고 있습니다.",
  ];

  const advices = [
    "동쪽 방향이 길합니다. 중요한 일은 동쪽에서 시작하세요.",
    "빨간색을 착용하면 운이 상승합니다.",
    "오전 시간대에 중요한 결정을 내리세요.",
    "물가에서 좋은 기운을 받을 수 있습니다.",
    "황금색 액세서리가 행운을 가져다줍니다.",
    "음력 1일과 15일에 좋은 일이 생깁니다.",
    "조용한 곳에서 생각을 정리하는 시간을 가지세요.",
    "가족의 응원이 큰 힘이 됩니다.",
    "나무와 관련된 것이 길합니다.",
    "새벽 기도나 명상이 좋은 기운을 불러옵니다.",
  ];

  const colors = ["빨강", "금색", "검정", "흰색", "파랑", "노랑", "초록"];

  // 띠별 궁합
  const compatibility: Record<string, { good: string; bad: string }> = {
    rat: { good: "용띠", bad: "말띠" },
    ox: { good: "뱀띠", bad: "양띠" },
    tiger: { good: "말띠", bad: "원숭이띠" },
    rabbit: { good: "양띠", bad: "닭띠" },
    dragon: { good: "쥐띠", bad: "개띠" },
    snake: { good: "소띠", bad: "돼지띠" },
    horse: { good: "호랑이띠", bad: "쥐띠" },
    sheep: { good: "토끼띠", bad: "소띠" },
    monkey: { good: "쥐띠", bad: "호랑이띠" },
    rooster: { good: "소띠", bad: "토끼띠" },
    dog: { good: "호랑이띠", bad: "용띠" },
    pig: { good: "토끼띠", bad: "뱀띠" },
  };

  const comp = compatibility[animalId] || { good: "쥐띠", bad: "말띠" };

  return {
    overall,
    love,
    money,
    health,
    work,
    fortune: fortunes[Math.floor(rng() * fortunes.length)],
    advice: advices[Math.floor(rng() * advices.length)],
    luckyNumber: Math.floor(rng() * 99) + 1,
    luckyColor: colors[Math.floor(rng() * colors.length)],
    compatibleAnimal: comp.good,
    incompatibleAnimal: comp.bad,
  };
}

function calculateCompatibility(
  userZodiac: string,
  userAnimal: string,
  celebrity: (typeof CELEBRITIES)[0],
  dateStr: string,
): {
  score: number;
  zodiacMatch: number;
  animalMatch: number;
  description: string;
  chemistry: string;
  advice: string;
} {
  const seed = hashCode(userZodiac + userAnimal + celebrity.id + dateStr);
  const rng = seededRandom(seed);

  // 별자리 궁합 (원소 기반)
  const zodiacElements: Record<string, string> = {
    aries: "fire",
    leo: "fire",
    sagittarius: "fire",
    taurus: "earth",
    virgo: "earth",
    capricorn: "earth",
    gemini: "air",
    libra: "air",
    aquarius: "air",
    cancer: "water",
    scorpio: "water",
    pisces: "water",
  };

  const userElement = zodiacElements[userZodiac] || "fire";
  const celebElement = zodiacElements[celebrity.zodiac] || "fire";

  let zodiacMatch = 50;
  if (userElement === celebElement) {
    zodiacMatch = 85 + Math.floor(rng() * 15);
  } else if (
    (userElement === "fire" && celebElement === "air") ||
    (userElement === "air" && celebElement === "fire") ||
    (userElement === "earth" && celebElement === "water") ||
    (userElement === "water" && celebElement === "earth")
  ) {
    zodiacMatch = 70 + Math.floor(rng() * 20);
  } else {
    zodiacMatch = 40 + Math.floor(rng() * 30);
  }

  // 띠 궁합
  const animalCompatibility: Record<string, string[]> = {
    rat: ["dragon", "monkey", "ox"],
    ox: ["snake", "rooster", "rat"],
    tiger: ["horse", "dog", "pig"],
    rabbit: ["sheep", "pig", "dog"],
    dragon: ["rat", "monkey", "rooster"],
    snake: ["ox", "rooster", "monkey"],
    horse: ["tiger", "sheep", "dog"],
    sheep: ["rabbit", "horse", "pig"],
    monkey: ["rat", "dragon", "snake"],
    rooster: ["ox", "dragon", "snake"],
    dog: ["tiger", "rabbit", "horse"],
    pig: ["rabbit", "sheep", "tiger"],
  };

  const goodMatch = animalCompatibility[userAnimal] || [];
  let animalMatch = 50;
  if (goodMatch.includes(celebrity.animal)) {
    animalMatch = 80 + Math.floor(rng() * 20);
  } else {
    animalMatch = 40 + Math.floor(rng() * 40);
  }

  const score = Math.floor((zodiacMatch + animalMatch) / 2);

  const descriptions = [
    `${celebrity.name}님과의 궁합은 매우 좋습니다! 서로의 장점을 살릴 수 있는 환상적인 조합이에요.`,
    `${celebrity.name}님과 함께라면 서로에게 긍정적인 영향을 줄 수 있어요.`,
    `${celebrity.name}님과의 관계는 노력에 따라 크게 발전할 수 있습니다.`,
    `${celebrity.name}님과는 서로 다른 매력을 가지고 있어 흥미로운 관계가 될 수 있어요.`,
    `${celebrity.name}님과 함께하면 새로운 경험을 많이 할 수 있을 거예요.`,
  ];

  const chemistries = [
    "운명적인 만남 같은 케미스트리가 느껴집니다! 💕",
    "서로를 이해하고 존중하는 따뜻한 관계가 될 거예요. 🌸",
    "함께 있으면 에너지가 넘치는 조합이에요! ⚡",
    "차분하고 안정적인 관계를 만들 수 있어요. 🌿",
    "서로에게 영감을 주는 특별한 인연이 될 수 있어요. ✨",
  ];

  const adviceList = [
    "서로의 취미를 공유해보세요. 공통 관심사가 관계를 더 깊게 만들어줄 거예요.",
    "작은 것에도 감사를 표현하면 관계가 더 좋아질 거예요.",
    "때로는 서로에게 공간을 주는 것도 중요해요.",
    "정직하고 열린 대화가 관계의 핵심이 될 거예요.",
    "함께 새로운 경험을 해보세요. 추억이 관계를 더 단단하게 만들어줄 거예요.",
  ];

  return {
    score,
    zodiacMatch,
    animalMatch,
    description: descriptions[Math.floor(rng() * descriptions.length)],
    chemistry: chemistries[Math.floor(rng() * chemistries.length)],
    advice: adviceList[Math.floor(rng() * adviceList.length)],
  };
}

// 해시 함수
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 시드 기반 난수 생성기
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
