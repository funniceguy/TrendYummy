"use client";

import React, { useState, useEffect } from 'react';
import { JulesAgentService, DeepResearchResult } from '@/services/JulesAgentService';
import { Bot, Send, Activity, BrainCircuit, Maximize2, X } from 'lucide-react';
import mermaid from 'mermaid';

export const JulesCommandCenter = () => {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<DeepResearchResult | null>(null);
    const [sessionStatus, setSessionStatus] = useState<any>(null); // Quick mock type
    const [showFullResult, setShowFullResult] = useState(false);

    useEffect(() => {
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });

        // Poll for status
        const interval = setInterval(() => {
            setSessionStatus(JulesAgentService.getSessionStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (result?.visualContent?.type === 'mindmap') {
            setTimeout(() => {
                mermaid.contentLoaded();
            }, 100);
        }
    }, [result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            const data = await JulesAgentService.analyze(query, 'manual');
            setResult(data);
            setShowFullResult(true);
        } catch (error) {
            alert("Failed to process request: " + error);
        } finally {
            setIsProcessing(false);
            setQuery('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 border-l border-white/10 glass-panel w-96 font-sans">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neon-magenta flex items-center gap-2">
                    <Bot className="w-6 h-6" /> Jules <span className="text-white text-sm font-normal">Command Center</span>
                </h2>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-neon-lime animate-pulse' : 'bg-gray-500'}`} />
                    {isProcessing ? 'Working...' : 'Ready'}
                </div>
            </div>

            {/* Status Monitor */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/10 bg-white/5">
                <div className="text-center p-2 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-xs text-gray-400 uppercase">Active Sessions</div>
                    <div className="text-2xl font-bold text-neon-lime">{sessionStatus?.active || 0}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-xs text-gray-400 uppercase">Idle Sessions</div>
                    <div className="text-2xl font-bold text-gray-400">{sessionStatus?.idle || 0}</div>
                </div>
            </div>

            {/* Output Area (Mini) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!result && !isProcessing && (
                    <div className="text-center text-gray-500 mt-10">
                        <BrainCircuit className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>명령을 기다리고 있습니다.<br />주제를 입력하여 심층 분석을 시작하세요.</p>
                    </div>
                )}

                {isProcessing && (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                        <div className="h-40 bg-white/5 rounded mt-4 border border-neon-cyan/30"></div>
                    </div>
                )}

                {result && !isProcessing && (
                    <div className="bg-white/5 rounded-xl border border-neon-magenta/30 p-4 relative group">
                        <button
                            onClick={() => setShowFullResult(true)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white bg-black/50 rounded"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <h3 className="font-bold text-neon-cyan mb-2">{result.query}</h3>
                        <div className="text-xs text-gray-300 line-clamp-4 markdown-preview">
                            {result.markdownReport}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/30">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="심층 분석할 주제 입력..."
                        className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-5 text-white focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta outline-none pr-12"
                        disabled={isProcessing}
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neon-magenta rounded-full text-white hover:bg-neon-magenta/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Full Screen Result Modal */}
            {showFullResult && result && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                    <div className="bg-gray-900 border border-neon-magenta w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.2)]">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <span className="text-neon-cyan">Jules Analysis:</span> {result.query}
                            </h2>
                            <button onClick={() => setShowFullResult(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Report Text */}
                            <div className="w-1/2 p-8 overflow-y-auto border-r border-white/10 prose prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-gray-300">
                                    {result.markdownReport}
                                </pre>
                            </div>

                            {/* Visuals */}
                            <div className="w-1/2 p-8 bg-black/20 flex flex-col">
                                <h3 className="text-lg font-bold text-neon-lime mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5" /> Thought Process Visualization
                                </h3>
                                <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center relative">
                                    {result.visualContent?.type === 'mindmap' && (
                                        <div className="mermaid">
                                            {result.visualContent.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
