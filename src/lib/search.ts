/**
 * Web Search Adapter
 * Stub with TODO for provider integration (Tavily/Serper/Bing)
 */

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export interface SearchOptions {
    maxResults?: number;
    domains?: string[]; // Allowlist
}

// TODO: Implement actual provider
// Environment variables needed:
// - SEARCH_PROVIDER: 'tavily' | 'serper' | 'bing'
// - TAVILY_API_KEY, SERPER_API_KEY, or BING_API_KEY

export async function searchWeb(
    query: string,
    apiKey: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
    const { maxResults = 5, domains } = options;

    // Stub: Return empty for now, implement provider
    console.log(`[SEARCH] Query: ${query}, Max: ${maxResults}, Domains: ${domains?.join(',')}`);

    // TODO: Implement Tavily
    // const response = await fetch('https://api.tavily.com/search', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     api_key: apiKey,
    //     query,
    //     max_results: maxResults,
    //     include_domains: domains,
    //   }),
    // });

    return [];
}

/**
 * Fetch and clean page content
 */
export async function fetchPageContent(
    url: string,
    maxChars: number = 20000
): Promise<{ content: string; hash: string } | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'StockCommand/1.0 (Financial Research Bot)',
                'Accept': 'text/html',
            },
        });

        if (!response.ok) return null;

        const html = await response.text();
        const content = stripHtml(html, maxChars);
        const hash = await computeHash(content);

        return { content, hash };
    } catch (e) {
        console.error(`[FETCH] Failed: ${url}`, e);
        return null;
    }
}

/**
 * Strip HTML to plain text
 */
function stripHtml(html: string, maxChars: number): string {
    // Remove script/style tags completely
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate
    if (text.length > maxChars) {
        text = text.substring(0, maxChars) + '...';
    }

    return text;
}

/**
 * Compute content hash for deduplication
 */
async function computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
