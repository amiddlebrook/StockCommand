
import { Env } from '../../types';

export type AgentType = 'ANALYST' | 'CODER' | 'CHAT';

export async function routeUserMessage(env: Env, message: string): Promise<AgentType> {
    const apiKey = env.OPENROUTER_DEEPSEEK_NEX_API_KEY; // Use same key for OpenRouter
    if (!apiKey) return 'ANALYST'; // Default to Analyst if no key

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://stockcommand.workers.dev",
                "X-Title": "StockCommand Router"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-nano-30b-a3b:free",
                messages: [
                    {
                        role: "system",
                        content: `You are the StockCommand Router. Classify user intent into exactly one category:
                        1. ANALYST - Stock analysis, price check, market questions, news.
                        2. CODER - Writing code, fixing bugs, software questions.
                        3. CHAT - Greetings, general chatter, philosophy.
                        
                        Reply ONLY with the single word: ANALYST, CODER, or CHAT.`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 5,
                temperature: 0.1
            })
        });

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim().toUpperCase();

        if (content?.includes("CODER")) return 'CODER';
        if (content?.includes("CHAT")) return 'CHAT';
        return 'ANALYST'; // Default to Analyst ( safest)

    } catch (e) {
        console.error("[Router] Routing failed, defaulting to Analyst:", e);
        return 'ANALYST';
    }
}
