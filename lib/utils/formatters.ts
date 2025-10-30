/**
 * Utility functions for the StockBrain application
 */

/**
 * Format a number as currency
 * 
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // "€1,234.56"
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format a number as percentage
 * 
 * @example
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(-0.05) // "-5.00%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number with abbreviations
 * 
 * @example
 * formatLargeNumber(1234567) // "1.23M"
 * formatLargeNumber(1234567890) // "1.23B"
 */
export function formatLargeNumber(value: number): string {
  const units = ['', 'K', 'M', 'B', 'T'];
  let unitIndex = 0;
  let formattedValue = value;

  while (Math.abs(formattedValue) >= 1000 && unitIndex < units.length - 1) {
    formattedValue /= 1000;
    unitIndex++;
  }

  return `${formattedValue.toFixed(2)}${units[unitIndex]}`;
}

/**
 * Validate a stock symbol format
 * 
 * @example
 * isValidSymbol('AAPL') // true
 * isValidSymbol('BRK.B') // true
 * isValidSymbol('invalid123') // false
 */
export function isValidSymbol(symbol: string): boolean {
  // Basic validation: 1-5 letters, optionally followed by .A, .B, etc.
  const symbolRegex = /^[A-Z]{1,5}(\.[A-Z])?$/;
  return symbolRegex.test(symbol.toUpperCase());
}

/**
 * Debounce a function
 * 
 * @example
 * const debouncedSearch = debounce(searchFunction, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle a function
 * 
 * @example
 * const throttledScroll = throttle(scrollHandler, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Calculate percentage change
 * 
 * @example
 * calculatePercentageChange(100, 110) // 10
 * calculatePercentageChange(100, 90) // -10
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format a date/time for display
 * 
 * @example
 * formatDateTime(new Date()) // "Jan 1, 2024 12:00 PM"
 */
export function formatDateTime(date: Date | number, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'number' ? new Date(date) : date;

  switch (format) {
    case 'long':
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(d);
    case 'time':
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(d);
    default:
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
  }
}
