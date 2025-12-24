import { Ticker } from './types';

// Standard Market Sectors (GICS Classification)
export type SectorName =
    | 'Technology'
    | 'Healthcare'
    | 'Financials'
    | 'Consumer Discretionary'
    | 'Consumer Staples'
    | 'Industrials'
    | 'Energy'
    | 'Utilities'
    | 'Materials'
    | 'Real Estate'
    | 'Communication Services';

// User builds their own universe - starts empty
// Users add tickers through the UI, which get stored in their watchlist
export const UNIVERSE: Ticker[] = [];

// Sector ETF References (for sector-level analysis)
// These are standard market ETFs that users can reference
export const SECTOR_ETFS: Record<SectorName, string> = {
    'Technology': 'XLK',
    'Healthcare': 'XLV',
    'Financials': 'XLF',
    'Consumer Discretionary': 'XLY',
    'Consumer Staples': 'XLP',
    'Industrials': 'XLI',
    'Energy': 'XLE',
    'Utilities': 'XLU',
    'Materials': 'XLB',
    'Real Estate': 'XLRE',
    'Communication Services': 'XLC',
};

// Helper to classify a symbol into a sector (for user-added tickers)
// Returns 'Unclassified' if unknown
export function classifySymbol(symbol: string): SectorName | 'Unclassified' {
    // Check if it's a sector ETF
    for (const [sector, etf] of Object.entries(SECTOR_ETFS)) {
        if (etf === symbol) return sector as SectorName;
    }
    return 'Unclassified';
}
