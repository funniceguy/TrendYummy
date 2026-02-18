import React, { useState, useEffect } from 'react';
import { Bot, Send, X, BrainCircuit, Activity } from 'lucide-react';
import { JulesAgentService } from '@/services/JulesAgentService';

interface JulesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (query: string) => void;
}

export const JulesInputModal: React.FC<JulesInputModalProps> = ({ isOpen, onClose, onAnalyze }) => {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionStatus, setSessionStatus] = useState({ total: 0, available: 0, active: 0 });

    useEffect(() => {
        if (!isOpen) return;

        // Initial fetch
        setSessionStatus(JulesAgentService.getSessionStatus());

        // Poll for status
        const interval = setInterval(() => {
            setSessionStatus(JulesAgentService.getSessionStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isProcessing || sessionStatus.available <= 0) return;

        setIsProcessing(true);
        try {
            await onAnalyze(query);
            onClose();
            setQuery('');
        } catch (error) {
            alert("요청 처리 실패: " + error);
        } finally {
            setIsProcessing(false);
        }
    };

    const isSystemBusy = sessionStatus.available <= 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gray-900 border border-neon-magenta rounded-2xl shadow-[0_0_50px_rgba(217,70,239,0.3)] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <h3 className="text-xl font-bold text-neon-magenta flex items-center gap-2">
                        <Bot className="w-6 h-6" /> Jules에게 명령하기
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className={`text-xs px-3 py-1 rounded-full border ${isSystemBusy ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-neon-lime/20 border-neon-lime text-neon-lime'} flex items-center gap-2`}>
                            <Activity className="w-3 h-3" />
                            <span>Available Agents: {sessionStatus.available} / {sessionStatus.total}</span>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    {isProcessing ? (
                        <div className="text-center py-8">
                            <BrainCircuit className="w-16 h-16 mx-auto text-neon-magenta animate-pulse mb-4" />
                            <h4 className="text-lg font-bold text-white mb-2">분석 중입니다...</h4>
                            <p className="text-sm text-gray-400">Jules가 심층 리포트를 작성하고 있습니다. 잠시만 기다려주세요.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <label className="block text-sm font-semibold text-gray-300 mb-3 ml-1">
                                무엇을 분석해 드릴까요?
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={isSystemBusy ? "현재 모든 에이전트가 통화중입니다." : "예: 최신 AI 트렌드, 양자 컴퓨터의 미래..."}
                                    className={`w-full bg-black/40 border rounded-xl py-4 px-5 text-white outline-none transition-all pr-12 text-lg ${isSystemBusy ? 'border-red-500/50 opacity-50 cursor-not-allowed' : 'border-white/20 focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta'}`}
                                    autoFocus={!isSystemBusy}
                                    disabled={isSystemBusy}
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isSystemBusy}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white transition-all ${isSystemBusy ? 'bg-gray-600 cursor-not-allowed' : 'bg-neon-magenta hover:bg-neon-magenta/80'}`}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>

                            {isSystemBusy ? (
                                <p className="text-xs text-red-400 mt-4 ml-1 flex items-center gap-1 animate-pulse">
                                    ⚠️ 현재 모든 분석 세션이 사용 중입니다. 잠시 후 다시 시도해주세요.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-4 ml-1">
                                    * 복잡한 주제일수록 분석에 시간이 걸릴 수 있습니다.
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
