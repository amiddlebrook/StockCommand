type Candle = { date: string; close: number };
type Quote = { symbol: string; name: string; price: number; previousClose: number; change: number; changePercent: number; history: Candle[]; asOf: string; source: string; delayed: boolean };
interface Env { ASSETS: Fetcher; AI?: { run: (model: string, options: unknown) => Promise<{ response?: string }> } }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
const validSymbol = (value: string) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(value);
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const round = (value: number) => Math.round(value * 100) / 100;
const timeoutFetch = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try { return await fetch(url, { headers: { "accept": "application/json,text/csv", "user-agent": "StockCommand/2.2" }, signal: controller.signal }); }
  finally { clearTimeout(timer); }
};
function quoteFromCandles(symbol: string, name: string, history: Candle[], source: string, previousClose?: number): Quote {
  if (!history.length) throw new Error("No price history from provider");
  const last = history[history.length - 1];
  const previous = previousClose && previousClose > 0 ? previousClose : history.length > 1 ? history[history.length - 2].close : last.close;
  const change = last.close - previous;
  return { symbol, name: name || symbol, price: round(last.close), previousClose: round(previous), change: round(change), changePercent: previous ? round(change / previous * 100) : 0, history, asOf: last.date, source, delayed: true };
}
async function fromYahoo(symbol: string): Promise<Quote> {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(symbol) + "?interval=1d&range=1y";
  const response = await timeoutFetch(url);
  if (!response.ok) throw new Error("Yahoo HTTP " + response.status);
  const payload = await response.json() as any;
  const chart = payload?.chart?.result?.[0];
  if (!chart?.timestamp?.length) throw new Error("Yahoo returned no chart");
  const closes: Array<number | null> = chart.indicators?.quote?.[0]?.close || [];
  const history: Candle[] = chart.timestamp.flatMap((ts: number, i: number) => {
    const close = number(closes[i]);
    return close !== null && close > 0 ? [{ date: new Date(ts * 1000).toISOString().slice(0, 10), close: round(close) }] : [];
  });
  const name = chart.meta?.shortName || chart.meta?.longName || symbol;
  return quoteFromCandles(symbol, name, history, "Yahoo Finance (unofficial, delayed)", undefined);
}
async function fromStooq(symbol: string): Promise<Quote> {
  const stooqSymbol = symbol.includes(".") ? symbol.toLowerCase() : symbol.toLowerCase() + ".us";
  const now = new Date();
  const d2 = now.toISOString().slice(0, 10).replace(/-/g, "");
  const d1 = new Date(now.getTime() - 370 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
  const response = await timeoutFetch("https://stooq.com/q/d/l/?s=" + encodeURIComponent(stooqSymbol) + "&i=d&d1=" + d1 + "&d2=" + d2);
  if (!response.ok) throw new Error("Stooq HTTP " + response.status);
  const csv = await response.text();
  const history: Candle[] = csv.trim().split(/\r?\n/).slice(1).flatMap(line => {
    const cells = line.split(",");
    const close = Number(cells[4]);
    return /^\d{4}-\d{2}-\d{2}$/.test(cells[0]) && Number.isFinite(close) && close > 0 ? [{ date: cells[0], close: round(close) }] : [];
  });
  return quoteFromCandles(symbol, symbol, history, "Stooq (end-of-day, delayed)");
}
async function loadQuote(symbol: string): Promise<Quote> {
  const errors: string[] = [];
  try {
    const cached = await caches.default.match(new Request("https://stockcommand.cache/quotes/" + symbol));
    if (cached) return await cached.json() as Quote;
  } catch {}
  for (const provider of [fromYahoo, fromStooq]) {
    try {
      const quote = await provider(symbol);
      try {
        const res = new Response(JSON.stringify(quote), { headers: { "cache-control": "public, max-age=900", "content-type": "application/json" } });
        await caches.default.put(new Request("https://stockcommand.cache/quotes/" + symbol), res);
      } catch {}
      return quote;
    } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  }
  throw new Error("Market data unavailable for " + symbol + ". Free providers may be rate-limited. " + errors.join("; "));
}
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
function computeBrief(quote: Quote) {
  const prices = quote.history.map(c => c.close);
  const last20 = prices.slice(-20);
  const last50 = prices.slice(-50);
  const sma20 = last20.length >= 20 ? round(average(last20)) : null;
  const sma50 = last50.length >= 50 ? round(average(last50)) : null;
  const returns = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = returns.slice(-14).map(x => Math.max(x, 0));
  const losses = returns.slice(-14).map(x => Math.max(-x, 0));
  const avgGain = average(gains), avgLoss = average(losses);
  const rsi = returns.length < 14 ? null : avgLoss === 0 ? 100 : round(100 - 100 / (1 + avgGain / avgLoss));
  const latest = quote.price;
  const direction = sma20 === null ? "Insufficient data for a 20-session trend." : latest > sma20 ? "Price sits above its 20-session moving average." : latest < sma20 ? "Price sits below its 20-session moving average." : "Price is at its 20-session moving average.";
  const momentum = rsi === null ? "Momentum data is unavailable." : rsi > 70 ? "RSI indicates elevated upside momentum (not a sell signal by itself)." : rsi < 30 ? "RSI indicates weak momentum (not a buy signal by itself)." : "RSI is in the middle range.";
  return { sma20, sma50, rsi14: rsi, summary: direction + " " + momentum + " Prices are delayed, and indicators are descriptive, not predictions." };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
    if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, app: "StockCommand", mode: "free", ai: !!env.AI, quotes: "free public market-data feeds (best effort)" });
    if (url.pathname === "/api/market" && request.method === "GET") {
      const symbols = [...new Set((url.searchParams.get("symbols") || "").toUpperCase().split(",").map(s => s.trim()).filter(Boolean))];
      if (!symbols.length || symbols.length > 12 || symbols.some(s => !validSymbol(s))) return json({ error: "Provide 1-12 valid stock symbols." }, 400);
      const results = await Promise.all(symbols.map(async symbol => {
        try { return { symbol, quote: await loadQuote(symbol) }; }
        catch (e) { return { symbol, error: e instanceof Error ? e.message : "Quote unavailable" }; }
      }));
      return json({ quotes: Object.fromEntries(results.filter(x => "quote" in x).map(x => [x.symbol, x.quote])), errors: Object.fromEntries(results.filter(x => "error" in x).map(x => [x.symbol, x.error])), fetchedAt: new Date().toISOString() });
    }
    if (url.pathname === "/api/brief" && request.method === "POST") {
      if (Number(request.headers.get("content-length") || "0") > 2048) return json({ error: "Request too large" }, 413);
      let body: any;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      const symbol = String(body?.symbol || "").toUpperCase().trim();
      if (!validSymbol(symbol)) return json({ error: "Invalid symbol" }, 400);
      try {
        const quote = await loadQuote(symbol, env);
        const indicators = computeBrief(quote);
        let narrative = indicators.summary, aiUsed = false;
        if (env.AI) {
          try {
            const prompt = "You are a neutral market research analyst. Analyze ONLY these verified delayed figures. Do not invent current prices or headlines. No guaranteed outcomes or personal trading advice. In 100 words or fewer, describe price action, risks, and what should be investigated next. Data: " + JSON.stringify({ symbol, price: quote.price, asOf: quote.asOf, source: quote.source, changePercent: quote.changePercent, ...indicators });
            const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages: [{ role: "system", content: "Be precise. No invented figures. This is educational market research." }, { role: "user", content: prompt }], max_tokens: 220 });
            if (result?.response?.trim()) { narrative = result.response.trim(); aiUsed = true; }
          } catch { /* The deterministic briefing is always available, even after AI quota exhaustion. */ }
        }
        return json({ symbol, quote, indicators, narrative, aiUsed, disclaimer: "Educational research only. Delayed pricing. Not investment advice." });
      } catch (e) { return json({ error: e instanceof Error ? e.message : "Provider unavailable" }, 503); }
    }
    return json({ error: "Endpoint not found" }, 404);
  }
} satisfies ExportedHandler<Env>;
