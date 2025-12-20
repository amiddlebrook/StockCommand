import { MarketData, PortfolioState, AgentAction, MarketClock } from '../types';

export type Timeline = '1m' | '1h' | '1d' | '1w' | '1M' | '1Y';

export interface CoreContext {
    scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL';
    target?: string;
    tool?: string;
    timeline: Timeline;
    marketData: Record<string, MarketData>;
    portfolio?: PortfolioState;
    apiKey: string;
}

export interface CoreOutput {
    analysis: string;
    actions: AgentAction[];
    clocks?: MarketClock[];
    sentimentScore?: number; // 0-100
    technicalSignal?: 'BUY' | 'SELL' | 'NEUTRAL';
}

export interface AgentCore {
    name: string;
    process(context: CoreContext): Promise<CoreOutput>;
}
