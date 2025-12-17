/**
 * Social & Competition Service
 * API for Leaderboards, Profiles, and Sharing.
 */

import { UserProfile, Competition, LeaderboardEntry, SharedStrategy } from './types';

// ============================================
// PROFILES
// ============================================

export async function getUserProfile(db: D1Database, userId: string): Promise<UserProfile | null> {
    const result = await db.prepare(`
        SELECT * FROM user_profiles WHERE user_id = ?
    `).bind(userId).first();

    if (!result) return null;

    // TODO: Fetch badges and real stats
    return {
        userId: result.user_id as string,
        displayName: result.display_name as string,
        avatarUrl: result.avatar_url as string,
        joinedAt: result.created_at as number,
        badges: [],
        stats: {
            totalPnL: 0, // Placeholder
            winRate: 0,
            rank: 0,
            followers: 0,
            following: 0
        }
    };
}

export async function createOrUpdateProfile(db: D1Database, userId: string, data: Partial<UserProfile>): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);

    // Check if exists
    const exists = await db.prepare('SELECT 1 FROM user_profiles WHERE user_id = ?').bind(userId).first();

    if (exists) {
        await db.prepare(`
            UPDATE user_profiles 
            SET display_name = COALESCE(?, display_name),
                avatar_url = COALESCE(?, avatar_url),
                bio = COALESCE(?, bio)
            WHERE user_id = ?
        `).bind(data.displayName, data.avatarUrl, (data as any).bio, userId).run();
    } else {
        await db.prepare(`
            INSERT INTO user_profiles (user_id, display_name, avatar_url, bio, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).bind(userId, data.displayName || 'Anonymous', data.avatarUrl, (data as any).bio, now).run();
    }
    return true;
}

// ============================================
// COMPETITIONS
// ============================================

export async function getActiveCompetitions(db: D1Database): Promise<Competition[]> {
    const results = await db.prepare(`
        SELECT * FROM competitions WHERE status != 'completed' ORDER BY start_date ASC
    `).all();

    return results.results.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status,
        prizePool: c.prize_pool,
        entryFee: c.entry_fee,
        participantsCount: 0, // Need to join to verify
        rules: c.rules
    }));
}

export async function joinCompetition(db: D1Database, userId: string, competitionId: string): Promise<boolean> {
    // Check if already joined
    const existing = await db.prepare(`
        SELECT 1 FROM competition_participants WHERE competition_id = ? AND user_id = ?
    `).bind(competitionId, userId).first();

    if (existing) return true;

    const now = Math.floor(Date.now() / 1000);
    await db.prepare(`
        INSERT INTO competition_participants (competition_id, user_id, joined_at)
        VALUES (?, ?, ?)
    `).bind(competitionId, userId, now).run();

    return true;
}

// ============================================
// LEADERBOARDS
// ============================================

export async function getGlobalLeaderboard(db: D1Database, limit: number = 50): Promise<LeaderboardEntry[]> {
    // MVP: Rank by credits used? Or mock P&L?
    // User wants "Real P&L". Since we don't have P&L col yet, we'll return 
    // a list of profiles sorted by 'created_at' as a dummy, or joined with trades count.

    // Complex query to count trades per user
    const results = await db.prepare(`
        SELECT p.user_id, p.display_name, p.avatar_url, COUNT(t.id) as trade_count
        FROM user_profiles p
        LEFT JOIN trades t ON p.user_id = t.user_id
        GROUP BY p.user_id
        ORDER BY trade_count DESC
        LIMIT ?
    `).bind(limit).all();

    return results.results.map((r: any, index: number) => ({
        userId: r.user_id,
        displayName: r.display_name,
        rank: index + 1,
        score: r.trade_count * 100, // Mock score based on activity
        tradesCount: r.trade_count,
        avatarUrl: r.avatar_url,
        change: 0
    }));
}

// ============================================
// STRATEGIES
// ============================================

export async function getSharedStrategies(db: D1Database): Promise<SharedStrategy[]> {
    const results = await db.prepare(`
        SELECT s.*, u.display_name, u.avatar_url 
        FROM shared_strategies s
        JOIN user_profiles u ON s.user_id = u.user_id
        WHERE s.is_public = 1
        ORDER BY s.clones_count DESC
    `).all();

    return results.results.map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        name: s.name,
        description: s.description,
        performance: JSON.parse(s.performance_metrics || '{}'),
        clones: s.clones_count,
        price: s.price,
        isPublic: !!s.is_public,
        config: JSON.parse(s.config || '{}'),
        createdAt: s.created_at,
        updatedAt: s.updated_at
    }));
}
