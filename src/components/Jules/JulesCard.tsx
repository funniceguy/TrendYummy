import React from 'react';
import { DeepResearchResult } from '@/services/JulesAgentService';
import { Bot, FileText, Sparkles } from 'lucide-react';

interface JulesCardProps {
    result: DeepResearchResult;
    onClick: (result: DeepResearchResult) => void;
}

export const JulesCard: React.FC<JulesCardProps> = ({ result, onClick }) => {
    return (
        <div className="relative group overflow-hidden rounded-xl border border-neon-magenta/30 bg-white/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-neon-magenta/60 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)]">
            {/* Neon Glow Effect on Hover (Magenta for Jules) */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neon-magenta/10 to-neon-purple/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-neon-magenta/10 border border-neon-magenta/20">
                    <Bot className="w-4 h-4 text-neon-magenta" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neon-magenta">Jules Analysis</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>User Request</span>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-neon-magenta transition-colors line-clamp-2">
                {result.query}
            </h3>

            <div className="text-gray-400 text-sm mb-4 line-clamp-3 markdown-preview">
                {/* Removing markdown syntax characters for cleaner preview if possible, or just raw */}
                {result.markdownReport.replace(/[#*`]/g, '').substring(0, 150)}...
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString('ko-KR')}</span>

                <button
                    onClick={() => onClick(result)}
                    className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/50 hover:bg-neon-magenta/20 hover:shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all flex items-center gap-1"
                >
                    <FileText className="w-3 h-3" /> 리포트 보기
                </button>
            </div>
        </div>
    );
};
