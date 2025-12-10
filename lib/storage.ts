import { AnalysisWidget } from '../services/geminiService';
import { MarketClock } from './agent/types';

const STORAGE_KEYS = {
    WIDGETS: 'stockcommand_widgets',
    REPORTS: 'stockcommand_reports',
    CLOCKS: 'stockcommand_clocks',
    SETTINGS: 'stockcommand_settings'
};

export const StorageService = {
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

    saveSettings: (settings: { freshnessHours: number }) => {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    },

    loadSettings: () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : { freshnessHours: 24 };
        } catch (e) {
            return { freshnessHours: 24 };
        }
    }
};
