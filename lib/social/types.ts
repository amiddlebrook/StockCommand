/**
 * Social & Competition Types
 */

export interface UserProfile {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    badges: Badge[];
    stats: {
        totalPnL: number;
        winRate: number;
        rank: number;
        followers: number;
        following: number;
    };
    joinedAt: number;
}

export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    awardedAt: number;
}

export interface Competition {
    id: string;
    title: string;
    description: string;
    startDate: number;
    endDate: number;
    status: 'upcoming' | 'active' | 'completed';
    prizePool: string;
    entryFee: number; // in Credits?
    participantsCount: number;
    rules: string;
}

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    rank: number;
    score: number; // P&L or ROI
    tradesCount: number;
    avatarUrl?: string;
    change: number; // Rank change
}

export interface SharedStrategy {
    id: string;
    userId: string; // Creator
    name: string;
    description: string;
    performance: {
        roi: number;
        winRate: number;
        drawdown: number;
    };
    clones: number;
    price: number; // Cost to clone (in Credits)
    isPublic: boolean;
    config: any; // The sanitized agent config
    createdAt: number;
    updatedAt: number;
}
