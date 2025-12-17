import { AnalysisWidget } from '../services/geminiService';
import { MarketClock, UserStrategy } from './agent/types';

const STORAGE_KEYS = {
    WIDGETS: 'stockcommand_widgets_v2',
    REPORTS: 'stockcommand_reports_v2',
    CLOCKS: 'stockcommand_clocks_v2',
    SETTINGS: 'stockcommand_settings_v2',
    RESEARCH_HISTORY: 'stockcommand_research_history_v1',
    STRATEGIES: 'stockcommand_strategies_v1'
};

export interface ResearchEntry {
    content: string;
    timestamp: number;
    status?: 'green' | 'yellow' | 'red';
}

export const StorageService = {
    // ... Existing methods ...
    saveWidgets: (widgets: AnalysisWidget[]) => {
        try {
            localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
        } catch (e) {
            console.error("Failed to save widgets", e);
        }
    },

    loadWidgets: (): AnalysisWidget[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.WIDGETS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },

    saveReports: (reports: Record<string, string>) => {
        try {
            localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        } catch (e) {
            console.error("Failed to save reports", e);
        }
    },

    loadReports: (): Record<string, string> => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    },

    saveClocks: (clocks: MarketClock[]) => {
        try {
            localStorage.setItem(STORAGE_KEYS.CLOCKS, JSON.stringify(clocks));
        } catch (e) {
            console.error("Failed to save clocks", e);
        }
    },

    loadClocks: (): MarketClock[] | null => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CLOCKS);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    },

    saveSettings: (settings: { freshnessHours: number; viewMode?: '2D' | '3D' }) => {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    },

    loadSettings: (): { freshnessHours: number; viewMode?: '2D' | '3D' } => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : { freshnessHours: 24, viewMode: '3D' };
        } catch (e) {
            return { freshnessHours: 24, viewMode: '3D' };
        }
    },

    saveResearchHistory: (history: Record<string, ResearchEntry[]>) => {
        try {
            localStorage.setItem(STORAGE_KEYS.RESEARCH_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save research history", e);
        }
    },

    loadResearchHistory: (): Record<string, ResearchEntry[]> => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.RESEARCH_HISTORY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    },

    addResearchEntry: (ticker: string, entry: ResearchEntry, history: Record<string, ResearchEntry[]>): Record<string, ResearchEntry[]> => {
        const entries = history[ticker] || [];
        const updated = [entry, ...entries].slice(0, 10);
        return { ...history, [ticker]: updated };
    },

    // Strategies
    saveStrategies: (strategies: UserStrategy[]) => {
        try {
            localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
        } catch (e) {
            console.error("Failed to save strategies", e);
        }
    },

    loadStrategies: (): UserStrategy[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },

    saveCloneStrategy: (strategy: UserStrategy) => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
            const strategies: UserStrategy[] = saved ? JSON.parse(saved) : [];
            const clone = {
                ...strategy,
                id: `clone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: `[CLONE] ${strategy.name}`,
                createdAt: Date.now(),
                active: false
            };
            strategies.push(clone);
            localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
        } catch (e) {
            console.error("Failed to clone strategy", e);
        }
    },

    resetToDefaults: () => {
        try {
            Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            window.location.reload();
        } catch (e) {
            console.error("Failed to reset application", e);
        }
    }
};
