# StockCommand

[GitHub Actions](https://github.com/amiddlebrook/StockCommand/actions) · [Production URL](https://stockcommand.averymiddlebrook2014.workers.dev)

StockCommand is a **Cloudflare-native, free-tier market research workspace**. It uses a React single-page app, a Cloudflare Worker for market data, and Cloudflare Workers AI for optional model summaries. No brokerage, payment service, OpenRouter key, database, or paid market-data API is required for the restored app.

## Functional features

- **Market overview**: up to twelve watchlist symbols, 1M / 3M / 1Y historical close chart, movement, as-of date, and source.
- **Watchlist**: add, select and remove tickers; settings persist locally in the browser.
- **Paper portfolio**: hypothetical holdings, weighted-average entry price, market value and unrealized P/L. No live orders.
- **Research**: SMA20, SMA50, RSI14, deterministic market brief, optional Cloudflare Workers AI narrative.
- **Integrity**: market data is explicitly delayed, source-attributed, and never silently replaced by fictitious prices.

### Market-data caveats

Best-effort public daily data comes from the unofficial Yahoo Finance chart endpoint, with Stooq end-of-day CSV as fallback. Neither provider is guaranteed: availability, rate limits, symbol coverage and data licensing may change. Verify data usage rights before operating the app commercially or redistributing market data. This is educational research, not an execution-quality market feed.

## Local setup

Node.js 22+ is recommended. Clone the repo, then:

    npm ci
    npm run build
    npx wrangler dev

The built app and API are served at http://127.0.0.1:8787. For frontend hot reload, run npm run dev alongside npx wrangler dev in another terminal; Vite proxies API requests to Wrangler.

Useful endpoints:

    GET /api/health
    GET /api/market?symbols=AAPL,MSFT
    POST /api/brief   {"symbol":"AAPL"}

## GitHub Actions deployment

1. Create a Cloudflare Free account and enable its workers.dev subdomain.
2. Create a scoped Cloudflare API token authorized to edit Workers in that account.
3. Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the repository's GitHub Actions secrets.
4. Pull requests run the build and a Wrangler dry-run check.
5. Merging to main runs the production deployment and a /api/health smoke test.

Manual deployment after logging into Wrangler:

    npm ci
    npm run build
    npx wrangler deploy

The Cloudflare Worker name is **stockcommand**. The deployment smoke test assumes the existing account subdomain averymiddlebrook2014.workers.dev; edit the workflow if your actual Cloudflare account subdomain differs.

## Free-tier boundary

The default wrangler.toml uses only Workers static assets and Workers AI. No Vectorize, R2, Queue, D1, Durable Object, or KV resource needs to be purchased or provisioned. Workers AI currently offers 10,000 free neurons per day on the Workers Free plan. When the AI free allocation is exhausted, the API falls back to a deterministic technical briefing; requests do not silently incur paid-model charges on a Free account.

Cloudflare's free plan has request and usage caps, and the independent public data providers may stop responding. **Zero cost depends on staying on the free plan and within its allowances**; there is no promise of unlimited service.

## Legacy code

Old agent, brokerage, RAG, collaboration and HUD modules remain in the repository for future porting, but are **not represented as operational in this release**. This revival prioritizes a verifiable functioning core over mocked advanced features.

## Privacy and risk

Watchlists and hypothetical positions remain in localStorage on the user's device; they are not synced or backed up. No third-party API keys are requested from end users and no real trading takes place. Indicators and AI commentary are not personalized investment advice.
