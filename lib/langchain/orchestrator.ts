/**
 * LangChain Orchestration Layer
 * 
 * Provides LangChain-style patterns for Cloudflare Workers.
 * Custom implementation optimized for Workers runtime.
 */

// Note: We use custom implementations instead of @langchain/core
// to ensure compatibility with Cloudflare Workers runtime

/**
 * OpenRouter LLM wrapper for LangChain
 */
export class OpenRouterLLM {
    private apiKey: string;
    private model: string;
    private temperature: number;

    constructor(config: {
        apiKey: string;
        model?: string;
        temperature?: number;
    }) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'deepseek/deepseek-chat';
        this.temperature = config.temperature || 0.2;
    }

    async invoke(messages: { role: string; content: string }[]): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://stockcommand.workers.dev',
                'X-Title': 'StockCommand LangChain'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role === 'human' ? 'user' : m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                })),
                temperature: this.temperature
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${err}`);
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;
    }

    async stream(messages: { role: string; content: string }[]) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://stockcommand.workers.dev',
                'X-Title': 'StockCommand LangChain'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role === 'human' ? 'user' : m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                })),
                temperature: this.temperature,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter Stream Error: ${response.status} - ${err}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        async function* generate(): AsyncGenerator<string> {
            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    const data = line.replace('data: ', '');
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) yield content;
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return generate();
    }
}

/**
 * Chain builder for common patterns
 */
export class ChainBuilder {
    private llm: OpenRouterLLM;

    constructor(llm: OpenRouterLLM) {
        this.llm = llm;
    }

    /**
     * Create a simple Q&A chain
     */
    createQAChain(systemPrompt: string) {
        return async (question: string, context?: string): Promise<string> => {
            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'human',
                    content: context
                        ? `Context:\n${context}\n\nQuestion: ${question}`
                        : question
                }
            ];
            return await this.llm.invoke(messages);
        };
    }

    /**
     * Create a RAG chain with context injection
     */
    createRAGChain(systemPrompt: string) {
        return async (question: string, documents: string[]): Promise<string> => {
            const context = documents.join('\n\n---\n\n');
            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'human',
                    content: `Based on the following documents, answer the question.

DOCUMENTS:
${context}

QUESTION: ${question}

Provide a comprehensive answer based on the documents. If the documents don't contain relevant information, say so.`
                }
            ];
            return await this.llm.invoke(messages);
        };
    }

    /**
     * Create a multi-step reasoning chain (Chain of Thought)
     */
    createCoTChain(systemPrompt: string) {
        return async (problem: string): Promise<{ thinking: string; answer: string }> => {
            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'human',
                    content: `Problem: ${problem}

Please solve this step by step:
1. First, analyze the problem
2. Break it down into smaller parts
3. Solve each part
4. Combine for final answer

Format your response as:
THINKING:
[Your step-by-step reasoning]

ANSWER:
[Your final answer]`
                }
            ];

            const response = await this.llm.invoke(messages);

            const thinkingMatch = response.match(/THINKING:\s*([\s\S]*?)(?=ANSWER:|$)/i);
            const answerMatch = response.match(/ANSWER:\s*([\s\S]*?)$/i);

            return {
                thinking: thinkingMatch?.[1]?.trim() || '',
                answer: answerMatch?.[1]?.trim() || response
            };
        };
    }

    /**
     * Create a structured output chain (JSON output)
     */
    createStructuredChain<T>(systemPrompt: string, schema: string) {
        return async (input: string): Promise<T> => {
            const messages = [
                {
                    role: 'system',
                    content: `${systemPrompt}

You MUST respond with valid JSON matching this schema:
${schema}

Do not include markdown code blocks, just raw JSON.`
                },
                { role: 'human', content: input }
            ];

            const response = await this.llm.invoke(messages);

            // Clean potential markdown
            let cleaned = response;
            if (cleaned.includes('```json')) {
                cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.replace(/```/g, '');
            }

            return JSON.parse(cleaned.trim()) as T;
        };
    }
}

/**
 * Agent executor for multi-agent workflows
 */
export class AgentExecutor {
    private llm: OpenRouterLLM;
    private tools: Map<string, (input: string) => Promise<string>>;

    constructor(llm: OpenRouterLLM) {
        this.llm = llm;
        this.tools = new Map();
    }

    registerTool(name: string, description: string, fn: (input: string) => Promise<string>) {
        this.tools.set(name, fn);
    }

    async execute(task: string, maxIterations: number = 5): Promise<{
        result: string;
        steps: { thought: string; action: string; observation: string }[];
    }> {
        const toolDescriptions = Array.from(this.tools.keys()).join(', ');
        const steps: { thought: string; action: string; observation: string }[] = [];

        let scratchpad = '';

        for (let i = 0; i < maxIterations; i++) {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI agent that can use tools to accomplish tasks.

Available tools: ${toolDescriptions}

For each step, respond in this format:
THOUGHT: [your reasoning]
ACTION: [tool_name: input] OR [FINISH: final answer]

If you have enough information, use FINISH to provide the final answer.`
                },
                {
                    role: 'human',
                    content: `Task: ${task}

${scratchpad ? `Previous steps:\n${scratchpad}` : ''}

What should you do next?`
                }
            ];

            const response = await this.llm.invoke(messages);

            const thoughtMatch = response.match(/THOUGHT:\s*(.*?)(?=ACTION:|$)/is);
            const actionMatch = response.match(/ACTION:\s*(.*?)$/is);

            const thought = thoughtMatch?.[1]?.trim() || '';
            const action = actionMatch?.[1]?.trim() || '';

            if (action.toLowerCase().startsWith('finish:')) {
                return {
                    result: action.replace(/^finish:\s*/i, ''),
                    steps
                };
            }

            // Parse tool call
            const toolMatch = action.match(/^(\w+):\s*(.*)$/);
            if (toolMatch) {
                const [, toolName, toolInput] = toolMatch;
                const tool = this.tools.get(toolName.toLowerCase());

                let observation: string;
                if (tool) {
                    observation = await tool(toolInput);
                } else {
                    observation = `Error: Tool "${toolName}" not found`;
                }

                steps.push({ thought, action, observation });
                scratchpad += `\nThought: ${thought}\nAction: ${action}\nObservation: ${observation}\n`;
            }
        }

        return {
            result: 'Max iterations reached without conclusion',
            steps
        };
    }
}
