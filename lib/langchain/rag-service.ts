/**
 * RAG Service - Retrieval Augmented Generation with Vectorize
 * 
 * Provides embedding generation and vector search for knowledge retrieval.
 * Uses Workers AI for embeddings and Cloudflare Vectorize for vector storage.
 */

import { Env } from '../../types';

interface Document {
    id: string;
    content: string;
    metadata: Record<string, any>;
}

interface SearchResult {
    id: string;
    content: string;
    score: number;
    metadata: Record<string, any>;
}

interface EmbeddingResult {
    id: string;
    values: number[];
}

export class RAGService {
    private env: Env;
    private embeddingModel: string = '@cf/baai/bge-base-en-v1.5';

    constructor(env: Env) {
        this.env = env;
    }

    /**
     * Generate embeddings using Workers AI
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];

        for (const text of texts) {
            const response = await this.env.AI.run(this.embeddingModel as any, {
                text: [text]
            }) as { data: number[][] };

            results.push(response.data[0]);
        }

        return results;
    }

    /**
     * Index documents into Vectorize
     */
    async indexDocuments(documents: Document[]): Promise<{ indexed: number; errors: string[] }> {
        const errors: string[] = [];
        const vectors: { id: string; values: number[]; metadata: Record<string, any> }[] = [];

        // Generate embeddings for all documents
        for (const doc of documents) {
            try {
                const [embedding] = await this.generateEmbeddings([doc.content]);
                vectors.push({
                    id: doc.id,
                    values: embedding,
                    metadata: {
                        ...doc.metadata,
                        content: doc.content.substring(0, 1000) // Store truncated content in metadata
                    }
                });
            } catch (error: any) {
                errors.push(`Failed to embed document ${doc.id}: ${error.message}`);
            }
        }

        // Upsert vectors into Vectorize
        if (vectors.length > 0) {
            try {
                await this.env.VECTORIZE.upsert(vectors);
            } catch (error: any) {
                errors.push(`Failed to upsert vectors: ${error.message}`);
            }
        }

        return {
            indexed: vectors.length,
            errors
        };
    }

    /**
     * Search for similar documents
     */
    async search(query: string, topK: number = 5): Promise<SearchResult[]> {
        // Generate query embedding
        const [queryEmbedding] = await this.generateEmbeddings([query]);

        // Search Vectorize
        const results = await this.env.VECTORIZE.query(queryEmbedding, {
            topK,
            returnMetadata: 'all'
        });

        return results.matches.map(match => ({
            id: match.id,
            content: (match.metadata as any)?.content || '',
            score: match.score,
            metadata: match.metadata as Record<string, any> || {}
        }));
    }

    /**
     * Delete documents by ID
     */
    async deleteDocuments(ids: string[]): Promise<{ deleted: number }> {
        await this.env.VECTORIZE.deleteByIds(ids);
        return { deleted: ids.length };
    }

    /**
     * RAG query - search + generate
     */
    async query(
        question: string,
        systemPrompt: string,
        topK: number = 5,
        openRouterKey: string
    ): Promise<{
        answer: string;
        sources: SearchResult[];
        tokensUsed?: number;
    }> {
        // 1. Retrieve relevant documents
        const sources = await this.search(question, topK);

        if (sources.length === 0) {
            return {
                answer: 'No relevant documents found to answer your question.',
                sources: []
            };
        }

        // 2. Build context from retrieved documents
        const context = sources
            .map((s, i) => `[${i + 1}] ${s.content}`)
            .join('\n\n');

        // 3. Generate answer using OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://stockcommand.workers.dev',
                'X-Title': 'StockCommand RAG'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Based on the following documents, answer the question.

DOCUMENTS:
${context}

QUESTION: ${question}

Provide a comprehensive answer. Cite document numbers [1], [2], etc. when referencing information.`
                    }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`RAG LLM Error: ${response.status} - ${err}`);
        }

        const data = await response.json() as any;

        return {
            answer: data.choices[0].message.content,
            sources,
            tokensUsed: data.usage?.total_tokens
        };
    }

    /**
     * Index documents from R2 storage
     */
    async indexFromR2(prefix: string): Promise<{ indexed: number; errors: string[] }> {
        const documents: Document[] = [];
        const errors: string[] = [];

        // List objects in R2 with prefix
        const listed = await this.env.STORAGE.list({ prefix });

        for (const object of listed.objects) {
            try {
                const obj = await this.env.STORAGE.get(object.key);
                if (obj) {
                    const content = await obj.text();
                    documents.push({
                        id: object.key,
                        content,
                        metadata: {
                            source: 'r2',
                            key: object.key,
                            size: object.size,
                            uploaded: object.uploaded.toISOString()
                        }
                    });
                }
            } catch (error: any) {
                errors.push(`Failed to read R2 object ${object.key}: ${error.message}`);
            }
        }

        // Index the documents
        const result = await this.indexDocuments(documents);
        return {
            indexed: result.indexed,
            errors: [...errors, ...result.errors]
        };
    }
}
