# Edge Cases & Failure Modes Analysis

## Introduction

This document identifies potential edge cases and failure modes in the StockBrain application,
along with recommended mitigation strategies.

## Data Layer Edge Cases

### Stock Symbol Validation

**Edge Cases:**
- Invalid symbols (numbers, special characters)
- Non-existent symbols
- Delisted stocks
- International symbols with different formats
- Symbols with dots (e.g., BRK.A, BRK.B)
- Cryptocurrency symbols (if supported)

**Current Handling:** ❌ No validation
**Recommended Solution:**
```typescript
// In lib/utils/formatters.ts
export function validateSymbol(symbol: string): boolean {
  // Regex pattern for valid US stock symbols
  const symbolRegex = /^[A-Z]{1,5}(\.[A-Z])?$/;
  return symbolRegex.test(symbol.toUpperCase());
}

// API call should validate before making request
if (!validateSymbol(symbol)) {
  throw new Error(ERROR_MESSAGES.INVALID_SYMBOL);
}
```

### API Failures

**Edge Cases:**
- Network timeout
- API rate limit exceeded
- Invalid API key
- Service outage
- Malformed responses
- Missing data fields

**Current Handling:** ✅ Partial - returns demo data
**Recommended Enhancement:**
```typescript
// In lib/api/stockAPI.ts
async getQuote(symbol: string): Promise<QuoteData> {
  try {
    // Check rate limit
    if (this.isRateLimited()) {
      throw new RateLimitError();
    }

    const response = await fetch(url, { timeout: 5000 });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new RateLimitError();
      }
      if (response.status === 404) {
        throw new SymbolNotFoundError(symbol);
      }
      throw new APIError(response.statusText);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!this.validateQuoteData(data)) {
      throw new InvalidDataError();
    }

    return this.transformQuoteData(data);
  } catch (error) {
    // Log error for monitoring
    console.error('Quote fetch failed:', error);
    
    // Return cached data if available
    const cached = this.getFromCache(symbol);
    if (cached) return cached;
    
    // Fallback to demo data
    return this.getDemoQuote(symbol);
  }
}
```

## UI/UX Edge Cases

### Loading States

**Edge Cases:**
- Very fast API responses (loading flashes)
- Very slow API responses (user thinks app froze)
- Multiple concurrent requests
- Request cancellation on unmount

**Current Handling:** ❌ Basic loading spinner
**Recommended Solution:**
```typescript
// Minimum loading time to prevent flash
const MIN_LOADING_TIME = 500;

// In components
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  const startTime = Date.now();
  setIsLoading(true);
  
  try {
    const data = await api.getQuote(symbol);
    
    // Ensure minimum loading time
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_LOADING_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
    }
    
    setData(data);
  } finally {
    setIsLoading(false);
  }
};
```

### Empty States

**Edge Cases:**
- No widgets on dashboard
- No search results
- No watchlist items
- No chat history

**Current Handling:** ❌ Not implemented
**Recommended Solution:**
```typescript
// Use EmptyState component
{widgets.length === 0 && (
  <EmptyState
    icon="📊"
    title="No analysis widgets"
    description="Add a stock symbol and select an analysis type to get started"
    action={<Button onClick={openToolbox}>Add Widget</Button>}
  />
)}
```

### Error States

**Edge Cases:**
- Network errors
- Invalid user input
- API errors
- Component errors (use ErrorBoundary)

**Current Handling:** ❌ Not comprehensive
**Recommended Solution:**
```typescript
// Wrap components in ErrorBoundary
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, info) => logError(error, info)}
>
  <App />
</ErrorBoundary>

// Show user-friendly error messages
{error && (
  <Alert variant="error">
    {getErrorMessage(error)}
    <Button onClick={retry}>Try Again</Button>
  </Alert>
)}
```

## Performance Edge Cases

### Large Datasets

**Edge Cases:**
- Rendering thousands of data points
- Historical data over long time periods
- Multiple charts updating simultaneously

**Current Handling:** ❌ No optimization
**Recommended Solution:**
```typescript
// Use data sampling for large datasets
function sampleData(data: DataPoint[], maxPoints: number = 500): DataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// Use virtualization for long lists
import { FixedSizeList } from 'react-window';
```

### Memory Leaks

**Edge Cases:**
- Unmounted components with pending requests
- Event listeners not cleaned up
- Timers not cleared
- Large cache not pruned

**Current Handling:** ❌ Potential issues
**Recommended Solution:**
```typescript
// Cancel requests on unmount
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(...)
    .catch(err => {
      if (err.name === 'AbortError') return;
      // Handle error
    });
  
  return () => controller.abort();
}, []);

// Clean up cache periodically
setInterval(() => {
  cache.prune(); // Remove expired entries
}, CACHE_CLEANUP_INTERVAL);
```

## Security Edge Cases

### XSS Attacks

**Edge Cases:**
- User input in chat
- Stock symbols with special characters
- API responses with HTML/scripts

**Current Handling:** ✅ React escapes by default
**Recommended Enhancement:**
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

### API Key Exposure

**Edge Cases:**
- Keys in client-side code
- Keys in error messages
- Keys in logs

**Current Handling:** ✅ Keys managed by Worker
**Best Practices:**
- Never include keys in frontend bundle
- Use environment variables
- Rotate keys regularly
- Use rate limiting

## Data Consistency Edge Cases

### Stale Data

**Edge Cases:**
- Cached data becomes outdated
- User sees old stock prices
- Chart doesn't reflect latest data

**Current Handling:** ❌ No cache invalidation
**Recommended Solution:**
```typescript
// Cache with TTL
class Cache {
  set(key: string, value: any, ttl: number) {
    this.data.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const entry = this.data.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }
    
    return entry.value;
  }
}
```

### Race Conditions

**Edge Cases:**
- User rapidly changes stock symbols
- Multiple requests for same symbol
- Updates arrive out of order

**Current Handling:** ❌ No request coordination
**Recommended Solution:**
```typescript
// Request deduplication
const pendingRequests = new Map();

async function fetchWithDedup(key: string, fetcher: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Use latest data only
let latestRequestId = 0;

async function fetchData(symbol: string) {
  const requestId = ++latestRequestId;
  const data = await api.getQuote(symbol);
  
  // Ignore if a newer request has been made
  if (requestId !== latestRequestId) return;
  
  setData(data);
}
```

## Mobile/Responsive Edge Cases

**Edge Cases:**
- Very small screens (<320px)
- Very large screens (>2560px)
- Landscape vs portrait orientation
- Touch vs mouse input
- Slow network (3G)

**Current Handling:** ✅ Basic responsive design
**Recommended Enhancements:**
- Test on actual devices
- Implement adaptive loading (smaller payloads for mobile)
- Use touch-friendly hit targets (min 44x44px)
- Support pinch-to-zoom on charts

## Browser Compatibility Edge Cases

**Edge Cases:**
- Old browsers without ES6 support
- Browsers without localStorage
- Browsers with JavaScript disabled
- Private/incognito mode restrictions

**Current Handling:** ❌ Not tested
**Recommended Solution:**
- Add polyfills for older browsers
- Gracefully degrade when localStorage unavailable
- Show message if JavaScript disabled

## Summary

Priority for implementation:
1. **High Priority**: API error handling, loading states, input validation
2. **Medium Priority**: Empty states, error boundaries, cache management
3. **Low Priority**: Performance optimizations, advanced security, browser compatibility

Most edge cases can be mitigated with:
- Proper error handling
- Input validation
- Caching strategy
- Loading/empty/error states
- Request coordination
- Memory management
