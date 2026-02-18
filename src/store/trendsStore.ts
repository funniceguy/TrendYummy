import { create } from 'zustand';
import { TrendItem, TrendService, CATEGORIES } from '@/services/TrendService';

interface Settings {
    refreshInterval: number; // in minutes
    categories: string[];
}

interface TrendState {
    trends: Record<string, TrendItem[]>;
    isLoading: boolean;
    selectedCategory: string; // 'All' or specific category
    settings: Settings;

    // Actions
    fetchTrends: () => Promise<void>;
    setSelectedCategory: (category: string) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useTrendStore = create<TrendState>((set) => ({
    trends: {},
    isLoading: false,
    selectedCategory: 'All',
    settings: {
        refreshInterval: 60,
        categories: CATEGORIES
    },

    fetchTrends: async () => {
        set({ isLoading: true });
        try {
            // For 'All', we fetch everything. In a real app we might optimize this.
            const data = await TrendService.fetchAllTrends();
            set({ trends: data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch trends", error);
            set({ isLoading: false });
        }
    },

    setSelectedCategory: (category) => set({ selectedCategory: category }),

    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    }))
}));
