/**
 * High-Performance Caching Layer
 * Optimized for 1M+ concurrent users, sub-10ms reads
 */

import {
    ClockArtifact,
    TickerArtifact,
    BUCKET_CONFIG,
    BucketType,
    clockKey,
    tickerKey,
    getBucket,
    isStale,
    CLOCK_DEFINITIONS
} from './types/artifacts';

// =============================================================================
// CACHE INTERFACE
// =============================================================================

export interface CacheResult<T> {
    data: T | null;
    hit: boolean;
    stale: boolean;
    needsRefresh: boolean;
    ageMs: number;
}

// =============================================================================
// CLOCK CACHE
// =============================================================================

export async function getClockFromCache(
    kv: KVNamespace,
    code: string
): Promise<CacheResult<ClockArtifact>> {
    const bucket = getBucket('clock');
    const key = clockKey(code, bucket);

    // Try current bucket first
    let data = await kv.get<ClockArtifact>(key, 'json');

    if (data) {
        const stale = isStale(data.createdAt, 'clock');
        return {
            data,
            hit: true,
            stale,
            needsRefresh: stale,
            ageMs: Date.now() - data.createdAt,
        };
    }

    // Try previous bucket (stale-while-revalidate)
    const prevBucket = bucket - BUCKET_CONFIG.clock.bucketMs;
    const prevKey = clockKey(code, prevBucket);
    data = await kv.get<ClockArtifact>(prevKey, 'json');

    if (data) {
        return {
            data,
            hit: true,
            stale: true,
            needsRefresh: true,
            ageMs: Date.now() - data.createdAt,
        };
    }

    return { data: null, hit: false, stale: false, needsRefresh: true, ageMs: 0 };
}

export async function setClockInCache(
    kv: KVNamespace,
    artifact: ClockArtifact
): Promise<void> {
    const bucket = getBucket('clock');
    const key = clockKey(artifact.code, bucket);
    const ttlSeconds = Math.floor(BUCKET_CONFIG.clock.ttlMs / 1000);

    await kv.put(key, JSON.stringify(artifact), { expirationTtl: ttlSeconds });
}

export async function getAllClocksFromCache(
    kv: KVNamespace
): Promise<{ clocks: Record<string, ClockArtifact | null>; needsRefresh: string[] }> {
    const codes = Object.keys(CLOCK_DEFINITIONS);
    const results = await Promise.all(
        codes.map(code => getClockFromCache(kv, code))
    );

    const clocks: Record<string, ClockArtifact | null> = {};
    const needsRefresh: string[] = [];

    codes.forEach((code, i) => {
        clocks[code] = results[i].data;
        if (results[i].needsRefresh) {
            needsRefresh.push(code);
        }
    });

    return { clocks, needsRefresh };
}

// =============================================================================
// TICKER CACHE
// =============================================================================

export async function getTickerFromCache(
    kv: KVNamespace,
    symbol: string,
    kind: 'brief' | 'news' | 'quote' = 'brief'
): Promise<CacheResult<TickerArtifact>> {
    const bucketType = `ticker_${kind}` as BucketType;
    const bucket = getBucket(bucketType);
    const key = tickerKey(symbol, kind, bucket);

    let data = await kv.get<TickerArtifact>(key, 'json');

    if (data) {
        const stale = isStale(data.createdAt, bucketType);
        return {
            data,
            hit: true,
            stale,
            needsRefresh: stale,
            ageMs: Date.now() - data.createdAt,
        };
    }

    // Try previous bucket
    const prevBucket = bucket - BUCKET_CONFIG[bucketType].bucketMs;
    const prevKey = tickerKey(symbol, kind, prevBucket);
    data = await kv.get<TickerArtifact>(prevKey, 'json');

    if (data) {
        return {
            data,
            hit: true,
            stale: true,
            needsRefresh: true,
            ageMs: Date.now() - data.createdAt,
        };
    }

    return { data: null, hit: false, stale: false, needsRefresh: true, ageMs: 0 };
}

export async function setTickerInCache(
    kv: KVNamespace,
    artifact: TickerArtifact
): Promise<void> {
    const bucketType = `ticker_${artifact.kind}` as BucketType;
    const bucket = getBucket(bucketType);
    const key = tickerKey(artifact.ticker, artifact.kind, bucket);
    const ttlSeconds = Math.floor(BUCKET_CONFIG[bucketType].ttlMs / 1000);

    await kv.put(key, JSON.stringify(artifact), { expirationTtl: ttlSeconds });
}

// =============================================================================
// BATCH OPERATIONS (For dashboard loading)
// =============================================================================

export async function batchGetTickers(
    kv: KVNamespace,
    symbols: string[],
    kind: 'brief' | 'news' | 'quote' = 'brief'
): Promise<{ tickers: Record<string, TickerArtifact | null>; needsRefresh: string[] }> {
    const results = await Promise.all(
        symbols.map(sym => getTickerFromCache(kv, sym, kind))
    );

    const tickers: Record<string, TickerArtifact | null> = {};
    const needsRefresh: string[] = [];

    symbols.forEach((sym, i) => {
        tickers[sym] = results[i].data;
        if (results[i].needsRefresh) {
            needsRefresh.push(sym);
        }
    });

    return { tickers, needsRefresh };
}

// =============================================================================
// USER WATCHLIST (Dynamic universe)
// =============================================================================

const WATCHLIST_KEY_PREFIX = 'wl:';

export async function getUserWatchlist(
    kv: KVNamespace,
    userId: string
): Promise<string[]> {
    const key = `${WATCHLIST_KEY_PREFIX}${userId}`;
    const data = await kv.get<string[]>(key, 'json');
    return data || [];
}

export async function setUserWatchlist(
    kv: KVNamespace,
    userId: string,
    symbols: string[]
): Promise<void> {
    const key = `${WATCHLIST_KEY_PREFIX}${userId}`;
    // No TTL - watchlists persist
    await kv.put(key, JSON.stringify(symbols));
}

export async function addToWatchlist(
    kv: KVNamespace,
    userId: string,
    symbol: string
): Promise<string[]> {
    const current = await getUserWatchlist(kv, userId);
    if (!current.includes(symbol)) {
        current.push(symbol);
        await setUserWatchlist(kv, userId, current);
    }
    return current;
}
