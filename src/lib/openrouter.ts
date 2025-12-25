/**
 * OpenRouter Client
 * Optimized for speed: streaming, strict JSON, low temperature
 */

export interface OpenRouterConfig {
    apiKey: string;
    baseUrl?: string;
    model: string;
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    jsonMode?: boolean;
    plugins?: any[];
}

/**
 * Non-streaming completion (for background jobs)
 */
export async function complete(
    config: OpenRouterConfig,
    messages: Message[],
    options: CompletionOptions = {}
): Promise<string> {
    const { temperature = 0.1, maxTokens = 1000, jsonMode = false } = options;

    console.log(`[complete] Calling model: ${config.model}`);
    console.log(`[complete] API key starts with: ${config.apiKey?.substring(0, 8)}...`);

    const body: any = {
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };

    // Only add optional fields if they have values
    if (jsonMode) {
        body.response_format = { type: 'json_object' };
    }
    if (options.plugins && options.plugins.length > 0) {
        body.plugins = options.plugins;
    }

    const response = await fetch(config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://stockcommand.averymiddlebrook2014.workers.dev',
            'X-Title': 'StockCommand',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[complete] OpenRouter error: ${response.status} - ${error}`);
        throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    console.log(`[complete] Response received, content length: ${data.choices?.[0]?.message?.content?.length || 0}`);
    return data.choices?.[0]?.message?.content || '';
}


/**
 * Streaming completion (for user-facing responses)
 */
export async function* streamComplete(
    config: OpenRouterConfig,
    messages: Message[],
    options: CompletionOptions = {}
): AsyncGenerator<string> {
    const { temperature = 0.3, maxTokens = 2000 } = options;

    const response = await fetch(config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://stockcommand.averymiddlebrook2014.workers.dev',
            'X-Title': 'StockCommand',
        },
        body: JSON.stringify({
            model: config.model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch {
                    // Skip malformed JSON
                }
            }
        }
    }
}

/**
 * Parse JSON from LLM response with healing
 */
export function parseJsonResponse<T>(response: string): T | null {
    // Try direct parse
    try {
        return JSON.parse(response);
    } catch {
        // Try to extract JSON from markdown code block
        const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch {
                // Fall through
            }
        }

        // Try to find JSON object in response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                // Fall through
            }
        }

        return null;
    }
}
