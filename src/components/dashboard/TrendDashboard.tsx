"use client";

import React, { useEffect, useState } from 'react';
import { useTrendStore } from '@/store/trendsStore';
import { TrendCard } from './TrendCard';
import { JulesCard } from '../Jules/JulesCard';
import { JulesInputModal } from '../Jules/JulesInputModal';
import { JulesAgentService, DeepResearchResult } from '@/services/JulesAgentService';
import { TrendItem } from '@/services/TrendService';
import { RefreshCw, Zap, BrainCircuit, FileText, Settings, X, Activity, Plus, Bot } from 'lucide-react';
import Link from 'next/link';
import mermaid from 'mermaid';

export const TrendDashboard = () => {
    const { trends, isLoading, selectedCategory, settings, fetchTrends, setSelectedCategory } = useTrendStore();
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [researchReports, setResearchReports] = useState<Record<string, DeepResearchResult>>({});
    const [selectedReport, setSelectedReport] = useState<DeepResearchResult | null>(null);
    const [manualResults, setManualResults] = useState<DeepResearchResult[]>([]);
    const [isJulesModalOpen, setIsJulesModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Toast 자동 숨기기
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        fetchTrends();
        // Set up interval for auto-refresh based on settings
        const interval = setInterval(fetchTrends, settings.refreshInterval * 60 * 1000);
        return () => clearInterval(interval);
    }, [settings.refreshInterval]);

    useEffect(() => {
        // Initialize mermaid for reports
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    }, []);

    useEffect(() => {
        if (selectedReport?.visualContent?.type === 'mindmap') {
            setTimeout(() => {
                mermaid.contentLoaded();
            }, 100);
        }
    }, [selectedReport]);

    // 비동기 분석 (Fire-and-Forget — UI를 차단하지 않음)
    const handleAnalyze = (item: TrendItem) => {
        if (analyzingIds.has(item.id)) return;

        setAnalyzingIds(prev => new Set(prev).add(item.id));
        setToastMessage(`🧠 "${item.keyword}" 분석을 시작했습니다. 완료 시 알림이 표시됩니다.`);

        // Fire-and-forget: .then() 사용하여 결과를 비동기로 처리
        JulesAgentService.analyze(item.keyword, 'trend', item.category)
            .then(result => {
                setResearchReports(prev => ({ ...prev, [item.id]: result }));
                setToastMessage(`✅ "${item.keyword}" 분석이 완료되었습니다! 카드의 리포트 아이콘을 클릭하세요.`);
            })
            .catch(error => {
                console.error("Analysis failed", error);
                setToastMessage(`❌ "${item.keyword}" 분석에 실패했습니다.`);
            })
            .finally(() => {
                setAnalyzingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(item.id);
                    return newSet;
                });
            });
    };

    const handleManualAnalyze = (query: string) => {
        setToastMessage(`🧠 "${query}" 분석을 시작했습니다...`);

        JulesAgentService.analyze(query, 'manual')
            .then(result => {
                setManualResults(prev => [result, ...prev]);
                setToastMessage(`✅ "${query}" 분석이 완료되었습니다!`);
                setSelectedCategory('Jules Analysis');
            })
            .catch(error => {
                console.error("Manual analysis failed", error);
                setToastMessage(`❌ "${query}" 분석에 실패했습니다.`);
            });
    };

    const filteredTrends = selectedCategory === 'All'
        ? Object.values(trends).flat()
        : trends[selectedCategory] || [];

    const isJulesCategory = selectedCategory === 'Jules Analysis';

    return (
        <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
            {/* Sidebar / Filters Panel - Width increased for Jules Command Center */}
            <aside className="w-80 glass-panel border-r border-white/10 flex flex-col z-20 shadow-2xl bg-black/40">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neon-cyan/20 rounded-lg border border-neon-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                            <Zap className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tighter neon-text-cyan">
                            Trend<span className="text-white">Yummy</span>
                        </h1>
                    </div>
                </div>

                {/* Navigation & Categories (Priority Display) */}
                <nav className="p-6 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">카테고리 (Categories)</h2>
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCategory === 'All' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        전체 보기 (All Trends)
                    </button>
                    {settings.categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCategory === cat ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {cat}
                        </button>
                    ))}

                    <div className="my-4 border-t border-white/10"></div>

                    {/* Jules Special Category */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedCategory('Jules Analysis')}
                            className={`flex-1 text-left px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${isJulesCategory ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Bot className="w-4 h-4" />
                            <span>Jules Analysis</span>
                        </button>
                        <button
                            onClick={() => setIsJulesModalOpen(true)}
                            className="p-3 rounded-xl bg-neon-magenta/10 hover:bg-neon-magenta/30 border border-neon-magenta/30 text-neon-magenta transition-all hover:scale-105 active:scale-95"
                            title="새 분석 요청"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t border-white/10">
                    <Link href="/settings" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all hover:bg-white/5 p-3 rounded-lg group border border-transparent hover:border-white/10">
                        <Settings className="w-5 h-5 group-hover:text-neon-cyan transition-colors" />
                        <span className="text-sm font-medium">시스템 설정 (Settings)</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-8 z-10 bg-black/20 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedCategory === 'All' ? <GlobeIcon className="w-5 h-5 text-gray-400" /> : <HashIcon className="w-5 h-5 text-gray-400" />}
                        {selectedCategory === 'All' ? '전체 트렌드' : selectedCategory} 대시보드
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                            {isJulesCategory ?
                                `분석된 리포트: ${manualResults.length}개` :
                                '자동 업데이트 대기중...'
                            }
                        </span>
                        <button
                            onClick={() => fetchTrends()}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors text-neon-cyan hover:rotate-180 duration-700"
                            title="새로고침"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {/* Display Jules Manual Results First */}
                        {isJulesCategory && (
                            <>
                                {manualResults.length === 0 ? (
                                    <div className="col-span-full text-center text-gray-500 py-20 flex flex-col items-center">
                                        <Bot className="w-12 h-12 mb-4 opacity-20 text-neon-magenta" />
                                        <p>아직 Jules에게 요청한 분석 내역이 없습니다.</p>
                                        <button
                                            onClick={() => setIsJulesModalOpen(true)}
                                            className="mt-4 px-4 py-2 bg-neon-magenta/20 text-neon-magenta rounded-lg hover:bg-neon-magenta/30 transition-all font-bold text-sm"
                                        >
                                            + 첫 번째 분석 요청하기
                                        </button>
                                    </div>
                                ) : (
                                    manualResults.map(result => (
                                        <JulesCard
                                            key={result.id}
                                            result={result}
                                            onClick={(r) => setSelectedReport(r)}
                                        />
                                    ))
                                )}
                            </>
                        )}

                        {!isJulesCategory && (
                            <>
                                {filteredTrends.length === 0 && !isLoading && (
                                    <div className="col-span-full text-center text-gray-500 py-20 flex flex-col items-center">
                                        <Zap className="w-12 h-12 mb-4 opacity-20" />
                                        <p>트렌드 데이터가 없습니다. 새로고침을 시도해보세요.</p>
                                    </div>
                                )}
                                {filteredTrends.map(item => (
                                    <div key={item.id} className="relative group">
                                        <TrendCard
                                            item={item}
                                            onAnalyze={handleAnalyze}
                                            isAnalyzing={analyzingIds.has(item.id)}
                                        />
                                        {researchReports[item.id] && (
                                            <div className="absolute top-2 right-2 z-20">
                                                <button
                                                    onClick={() => setSelectedReport(researchReports[item.id])}
                                                    className="p-2 bg-neon-magenta rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)] animate-bounce hover:scale-110 transition-transform"
                                                    title="리포트 보기"
                                                >
                                                    <FileText className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Report Modal / Overlay */}
                {selectedReport && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-12">
                        <div className="bg-gray-900 border border-neon-magenta/50 w-full max-w-6xl h-[90vh] overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(217,70,239,0.3)] flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                                <h3 className="text-2xl font-bold text-neon-magenta flex items-center gap-2">
                                    <BrainCircuit className="w-6 h-6" /> Jules 심층 분석 결과
                                </h3>
                                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                                </button>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                <div className="w-1/2 p-8 overflow-y-auto border-r border-white/10 prose prose-invert max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                                        {selectedReport.markdownReport}
                                    </pre>
                                </div>
                                <div className="w-1/2 p-8 bg-black/20 flex flex-col">
                                    <h3 className="text-lg font-bold text-neon-lime mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5" /> 사고 과정 시각화 (Visualization)
                                    </h3>
                                    <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center relative">
                                        {selectedReport.visualContent?.type === 'mindmap' ? (
                                            <div className="mermaid">
                                                {selectedReport.visualContent.content}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">시각화 데이터 없음</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-black/20 text-xs text-gray-500 text-right flex justify-between px-8">
                                <span>Session ID: {selectedReport.id}</span>
                                <span>분석 소요 시간: {selectedReport.analysisTime}초 | 참조 출처: {selectedReport.sourceCount}개</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Jules Input Modal */}
                <JulesInputModal
                    isOpen={isJulesModalOpen}
                    onClose={() => setIsJulesModalOpen(false)}
                    onAnalyze={handleManualAnalyze}
                />

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-[100] max-w-md animate-in slide-in-from-bottom-4">
                        <div className="bg-gray-900/95 border border-neon-cyan/30 backdrop-blur-lg rounded-xl px-5 py-3 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-sm text-gray-200">
                            {toastMessage}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Icons components for internal usage

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
);

const HashIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9" /><line x1="4" x2="20" y1="15" y2="15" /><line x1="10" x2="8" y1="3" y2="21" /><line x1="16" x2="14" y1="3" y2="21" /></svg>
);
