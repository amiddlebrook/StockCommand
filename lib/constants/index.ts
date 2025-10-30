/**
 * Application-wide constants
 */

/**
 * Available stock market data providers
 */
export const STOCK_DATA_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  FINNHUB: 'finnhub',
  IEX_CLOUD: 'iexcloud',
} as const;

/**
 * Time intervals for stock data
 */
export const TIME_INTERVALS = {
  ONE_MINUTE: '1min',
  FIVE_MINUTES: '5min',
  FIFTEEN_MINUTES: '15min',
  THIRTY_MINUTES: '30min',
  ONE_HOUR: '60min',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

/**
 * Time ranges for historical data
 */
export const TIME_RANGES = {
  ONE_DAY: '1D',
  FIVE_DAYS: '5D',
  ONE_MONTH: '1M',
  THREE_MONTHS: '3M',
  SIX_MONTHS: '6M',
  ONE_YEAR: '1Y',
  FIVE_YEARS: '5Y',
  MAX: 'MAX',
} as const;

/**
 * Chart types available in the application
 */
export const CHART_TYPES = {
  LINE: 'line',
  CANDLESTICK: 'candlestick',
  BAR: 'bar',
  AREA: 'area',
  VOLUME: 'volume',
} as const;

/**
 * Widget types
 */
export const WIDGET_TYPES = {
  DIVERGENCE: 'divergence',
  GHOST_PATTERN: 'ghost',
  OPTIONS_STRATEGY: 'options',
  PROFILE: 'profile',
  NEWS: 'news',
  COMPARISON: 'comparison',
  TECHNICAL_INDICATORS: 'technical',
  SENTIMENT: 'sentiment',
  ERROR: 'error',
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  QUOTE_TTL: 60 * 1000, // 1 minute
  PROFILE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  HISTORICAL_TTL: 5 * 60 * 1000, // 5 minutes
  SEARCH_TTL: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * API rate limits
 */
export const RATE_LIMITS = {
  ALPHA_VANTAGE: {
    REQUESTS_PER_MINUTE: 5,
    REQUESTS_PER_DAY: 500,
  },
  FINNHUB: {
    REQUESTS_PER_MINUTE: 60,
  },
  IEX_CLOUD: {
    REQUESTS_PER_SECOND: 100,
  },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_SYMBOL: 'Invalid stock symbol format',
  SYMBOL_NOT_FOUND: 'Stock symbol not found',
  API_ERROR: 'Error fetching stock data. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'stockbrain_theme',
  WATCHLIST: 'stockbrain_watchlist',
  FAVORITES: 'stockbrain_favorites',
  RECENT_SEARCHES: 'stockbrain_recent_searches',
  USER_PREFERENCES: 'stockbrain_preferences',
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  SYMBOL: 'AAPL',
  INTERVAL: TIME_INTERVALS.DAILY,
  RANGE: TIME_RANGES.ONE_MONTH,
  CHART_TYPE: CHART_TYPES.LINE,
  MAX_RECENT_SEARCHES: 10,
  MAX_WATCHLIST_ITEMS: 50,
} as const;
