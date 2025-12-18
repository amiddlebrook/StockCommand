# Next Steps for StockCommand Deployment 🚀

The application code is "Production Ready":
- **Clean State**: No more mock data/preloaded portfolios.
- **Integrated Broker**: Automatically toggles to "Holdings View" when connected.
- **Dynamic Search**: You can add ANY ticker via Command Palette (`Cmd+K`).

To make this live on your Cloudflare URL, follow these steps:

## 1. Build and Deploy Code

Push the latest frontend and backend code to Cloudflare Workers.

```bash
# Build the frontend (Vite)
npm run build

# Deploy to Cloudflare (Workers/Pages)
npx wrangler deploy
```

> **Note**: If you are using GitHub Actions, pushing to `main` (which we just did) typically triggers a deployment automatically. Check your GitHub Repo Actions tab.

## 2. Apply Database Schema

Ensure the D1 Database has all the latest tables (Social, Fuel, Agent, etc.).

```bash
# Apply schema to REMOTE production database
npx wrangler d1 execute stockbrain-db --remote --file=./schema.sql
```

## 3. Configure Secrets (Critical)

For the **Agent** and **Broker Integrations** to work, you must set these secrets in Cloudflare.

**AI Keys (Required for Analysis):**
```bash
npx wrangler secret put GOOGLE_API_KEY
npx wrangler secret put OPENAI_API_KEY
# (Add others as needed: ANTHROPIC_API_KEY, etc.)
```

**Security Keys (Critical):**
You MUST set an encryption secret to secure your broker options.
```bash
# Generate a random 32-character string (or similar)
npx wrangler secret put ENCRYPTION_SECRET
```

**Broker Keys (Required for Trading):**
*Wait until you have these from IBKR/Alpaca.*
```bash
npx wrangler secret put IBKR_CLIENT_ID
npx wrangler secret put IBKR_CLIENT_SECRET
npx wrangler secret put IBKR_REDIRECT_URI
npx wrangler secret put ALPACA_KEY_ID
npx wrangler secret put ALPACA_SECRET_KEY
```

**Payment Keys (Required for Agent Fuel):**
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## 4. Verify Live Site

1.  Go to `https://stockcommand.averymiddlebrook2014.workers.dev/`
2.  **Check Empty State**: Ensure the portfolio is empty (no NVDA/AMD bubbles).
3.  **Test Command Palette**: Press `Cmd+K` (or Ctrl+K) -> Type `SPY` -> Select `Analyze $SPY`.
    - It should run the Agent Scan (Verify logs or "Agent Active" status).
    - It should add SPY to your Watchlist.
4.  **Connect Broker**: Click "Connect Broker".
    - Since you don't have keys yet, it might error or show "Coming Soon". This is expected until Secrets are set.

## 5. Next Phase: Broker Keys

Once you obtain your **IBKR Third Party Integration Key**, update the secrets (Step 3) and you are live with real money trading!
