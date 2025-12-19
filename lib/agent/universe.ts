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

// Production Universe - Empty by default, users add their own tickers
export const UNIVERSE: Ticker[] = [];

// Sector ETF References (for sector-level analysis)
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
