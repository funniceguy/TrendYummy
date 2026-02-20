import React from "react";
import { TrendItem } from "@/services/TrendService";
import {
  Cpu,
  DollarSign,
  ExternalLink,
  Film,
  Gamepad2,
  Globe,
  Landmark,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

interface TrendCardProps {
  item: TrendItem;
}

const categoryIcons: Record<string, React.ReactNode> = {
  연예: <Film className="h-4 w-4 text-neon-magenta" />,
  스포츠: <Trophy className="h-4 w-4 text-neon-cyan" />,
  경제: <DollarSign className="h-4 w-4 text-neon-green" />,
  정치: <Landmark className="h-4 w-4 text-neon-blue" />,
  사회: <Users className="h-4 w-4 text-yellow-400" />,
  IT: <Cpu className="h-4 w-4 text-neon-cyan" />,
  게임: <Gamepad2 className="h-4 w-4 text-purple-400" />,
  기타: <Zap className="h-4 w-4 text-gray-400" />,
};

export const TrendCard: React.FC<TrendCardProps> = ({ item }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neon-cyan/5 to-neon-magenta/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2">
          {categoryIcons[item.category] || (
            <Globe className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            {item.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-neon-cyan">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-bold">{item.score}</span>
          {item.trafficVolume ? (
            <span className="ml-1 text-xs text-gray-500">({item.trafficVolume})</span>
          ) : null}
        </div>
      </div>

      <h3 className="mb-2 line-clamp-2 text-xl font-bold text-white transition-colors group-hover:text-neon-cyan">
        {item.title}
      </h3>

      <p className="mb-4 line-clamp-3 text-sm text-gray-400">{item.summary}</p>

      <div className="mt-auto flex items-center gap-3 border-t border-white/5 pt-4">
        <span className="text-xs text-gray-500">
          {new Date(item.timestamp).toLocaleString("ko-KR")} · {item.source}
        </span>
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-neon-cyan/70 transition-colors hover:text-neon-cyan"
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            링크
          </a>
        ) : null}
      </div>
    </div>
  );
};
