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

// Demo Universe - Popular stocks for presentation
export const UNIVERSE: Ticker[] = [
    // Technology
    { symbol: 'AAPL', sector: 'Technology', role: 'Consumer Electronics & Services' },
    { symbol: 'MSFT', sector: 'Technology', role: 'Enterprise Software & Cloud' },
    { symbol: 'GOOGL', sector: 'Technology', role: 'Search & Cloud Platform' },
    { symbol: 'NVDA', sector: 'Technology', role: 'AI & GPU Computing' },
    { symbol: 'META', sector: 'Technology', role: 'Social Media & Metaverse' },
    { symbol: 'AMZN', sector: 'Technology', role: 'E-Commerce & Cloud' },
    { symbol: 'TSLA', sector: 'Technology', role: 'Electric Vehicles & Energy' },
    { symbol: 'AMD', sector: 'Technology', role: 'Semiconductors' },
    { symbol: 'CRM', sector: 'Technology', role: 'Enterprise CRM' },
    { symbol: 'ORCL', sector: 'Technology', role: 'Database & Cloud' },

    // Healthcare
    { symbol: 'UNH', sector: 'Healthcare', role: 'Managed Care' },
    { symbol: 'JNJ', sector: 'Healthcare', role: 'Pharmaceuticals & MedTech' },
    { symbol: 'PFE', sector: 'Healthcare', role: 'Pharmaceuticals' },
    { symbol: 'ABBV', sector: 'Healthcare', role: 'Biopharmaceuticals' },
    { symbol: 'LLY', sector: 'Healthcare', role: 'Pharmaceuticals' },

    // Financials
    { symbol: 'JPM', sector: 'Financials', role: 'Investment Banking' },
    { symbol: 'BAC', sector: 'Financials', role: 'Commercial Banking' },
    { symbol: 'GS', sector: 'Financials', role: 'Investment Banking' },
    { symbol: 'V', sector: 'Financials', role: 'Payment Networks' },
    { symbol: 'MA', sector: 'Financials', role: 'Payment Networks' },

    // Energy
    { symbol: 'XOM', sector: 'Energy', role: 'Integrated Oil & Gas' },
    { symbol: 'CVX', sector: 'Energy', role: 'Integrated Oil & Gas' },
    { symbol: 'COP', sector: 'Energy', role: 'Exploration & Production' },

    // Industrials
    { symbol: 'CAT', sector: 'Industrials', role: 'Heavy Equipment' },
    { symbol: 'BA', sector: 'Industrials', role: 'Aerospace & Defense' },
    { symbol: 'HON', sector: 'Industrials', role: 'Industrial Conglomerate' },
    { symbol: 'UPS', sector: 'Industrials', role: 'Logistics' },

    // Consumer Discretionary
    { symbol: 'HD', sector: 'Consumer Discretionary', role: 'Home Improvement Retail' },
    { symbol: 'NKE', sector: 'Consumer Discretionary', role: 'Athletic Apparel' },
    { symbol: 'SBUX', sector: 'Consumer Discretionary', role: 'Coffee Retail' },
    { symbol: 'MCD', sector: 'Consumer Discretionary', role: 'Quick Service Restaurants' },

    // Consumer Staples
    { symbol: 'PG', sector: 'Consumer Staples', role: 'Household Products' },
    { symbol: 'KO', sector: 'Consumer Staples', role: 'Beverages' },
    { symbol: 'PEP', sector: 'Consumer Staples', role: 'Beverages & Snacks' },
    { symbol: 'WMT', sector: 'Consumer Staples', role: 'Retail' },

    // Communication Services
    { symbol: 'DIS', sector: 'Communication Services', role: 'Entertainment' },
    { symbol: 'NFLX', sector: 'Communication Services', role: 'Streaming' },
    { symbol: 'T', sector: 'Communication Services', role: 'Telecommunications' },

    // Utilities
    { symbol: 'NEE', sector: 'Utilities', role: 'Renewable Energy' },
    { symbol: 'DUK', sector: 'Utilities', role: 'Electric Utilities' },

    // Real Estate
    { symbol: 'AMT', sector: 'Real Estate', role: 'Cell Tower REITs' },
    { symbol: 'PLD', sector: 'Real Estate', role: 'Industrial REITs' },

    // Materials
    { symbol: 'LIN', sector: 'Materials', role: 'Industrial Gases' },
    { symbol: 'APD', sector: 'Materials', role: 'Industrial Gases' },
];

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
