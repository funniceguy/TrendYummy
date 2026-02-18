import React from 'react';
import { TrendItem } from '@/services/TrendService';
import { Globe, TrendingUp, Cpu, Film, Landmark, DollarSign, BrainCircuit, Gamepad2, Users, Trophy, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendCardProps {
    item: TrendItem;
    onAnalyze?: (item: TrendItem) => void;
    isAnalyzing?: boolean;
}

const CategoryIcons: Record<string, React.ReactNode> = {
    // Korean categories (from API)
    "연예": <Film className="w-4 h-4 text-neon-magenta" />,
    "스포츠": <Trophy className="w-4 h-4 text-neon-cyan" />,
    "경제": <DollarSign className="w-4 h-4 text-neon-green" />,
    "정치": <Landmark className="w-4 h-4 text-neon-blue" />,
    "사회": <Users className="w-4 h-4 text-yellow-400" />,
    "IT": <Cpu className="w-4 h-4 text-neon-cyan" />,
    "게임": <Gamepad2 className="w-4 h-4 text-purple-400" />,
    "기타": <Zap className="w-4 h-4 text-gray-400" />,
};

export const TrendCard: React.FC<TrendCardProps> = ({ item, onAnalyze, isAnalyzing }) => {
    return (
        <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            {/* Neon Glow Effect on Hover */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neon-cyan/5 to-neon-magenta/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                    {CategoryIcons[item.category] || <Globe className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">{item.category}</span>
                </div>
                <div className="flex items-center gap-1 text-neon-cyan">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold">{item.score}</span>
                    {item.trafficVolume && (
                        <span className="text-xs text-gray-500 ml-1">({item.trafficVolume})</span>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-neon-cyan transition-colors line-clamp-2">
                {item.title}
            </h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {item.summary}
            </p>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString('ko-KR')} • {item.source}</span>
                    {item.link && (
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-neon-cyan/70 hover:text-neon-cyan transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3 h-3" />
                            검색
                        </a>
                    )}
                </div>

                {onAnalyze && (
                    <button
                        onClick={() => onAnalyze(item)}
                        disabled={isAnalyzing}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                            isAnalyzing
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        )}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-1">
                                <BrainCircuit className="w-3 h-3 animate-pulse" /> 분석중...
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <BrainCircuit className="w-3 h-3" /> 심층 분석
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
