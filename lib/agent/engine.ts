import { MarketData, RotationRule, AgentAction, PortfolioState, MarketClock } from './types';
import { LLMService } from './llm-service';

export class AgentEngine {
    private llmService: LLMService;

    constructor(apiKey: string) {
        this.llmService = new LLMService(apiKey);
    }

    public async evaluate(
        scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL', // Updated type
        marketData: Record<string, MarketData>,
        portfolio: PortfolioState, // Passed but LLM currently focuses on market data + text
        target?: string,
        tool?: string
    ): Promise<{ analysis: string; actions: AgentAction[], clocks?: MarketClock[] }> {

        console.log(`[Engine] Running AI evaluation for scope: ${scope}, target: ${target}, tool: ${tool}`);

        // Delegate complex reasoning to LLM
        const result = await this.llmService.analyze(scope, marketData, target, tool);

        // We could potentially add "Hard encoded" safety checks here
        // e.g. "Never sell > 50% of NVDA" regardless of LLM output

        return result;
    }
}
