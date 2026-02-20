"use client";

import React, { useState } from 'react';
import { useTrendStore } from '@/store/trendsStore';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { settings, updateSettings } = useTrendStore();
    const [interval, setInterval] = useState(settings.refreshInterval);
    const [categories, setCategories] = useState(settings.categories.join('\n'));
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleSave = () => {
        if (isSaving) {
            return;
        }

        setIsSaving(true);
        const categoryList = categories.split('\n').filter(c => c.trim() !== '');
        updateSettings({
            refreshInterval: interval,
            categories: categoryList
        });
        alert('설정이 저장되었습니다!');
        router.push('/');
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
            <div className="w-full max-w-2xl glass-panel p-8 border border-white/10 rounded-2xl relative">
                {/* Neon Glow */}
                <div className="absolute inset-0 -z-10 bg-neon-cyan/5 blur-3xl rounded-full" />

                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">시스템 설정</h1>
                </div>

                <div className="space-y-8">
                    {/* Interval Setting */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-neon-cyan uppercase tracking-wider block">
                            트렌드 분석 주기 (분)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="10"
                                max="240"
                                step="10"
                                value={interval}
                                onChange={(e) => setInterval(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                            />
                            <span className="text-white font-mono bg-white/10 px-3 py-1 rounded border border-white/5 w-20 text-center">
                                {interval}분
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">
                            설정된 주기마다 자동으로 새로운 트렌드를 수집하고 분석합니다.
                        </p>
                    </div>

                    {/* Categories Setting */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-neon-magenta uppercase tracking-wider block">
                            모니터링 카테고리
                        </label>
                        <textarea
                            value={categories}
                            onChange={(e) => setCategories(e.target.value)}
                            rows={10}
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white font-sans focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta outline-none transition-all resize-none"
                            placeholder="한 줄에 하나씩 카테고리를 입력하세요"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>* 한 줄에 하나의 카테고리를 입력하세요.</span>
                            <button
                                onClick={() => setCategories(settings.categories.join('\n'))}
                                disabled={isSaving}
                                className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> 초기화
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold py-3 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? '저장 중...' : '설정 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
