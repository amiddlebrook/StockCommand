

# StockBrain - AI Stock Analyzer

[![Deploy to Cloudflare Workers](https://github.com/amiddlebrook/StockBrain/actions/workflows/deploy.yml/badge.svg)](https://github.com/amiddlebrook/StockBrain/actions/workflows/deploy.yml)
[![CI - Pull Request Checks](https://github.com/amiddlebrook/StockBrain/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/amiddlebrook/StockBrain/actions/workflows/pr-checks.yml)

An adaptive AI environment where users can analyze stocks and options through natural conversation. The AI generates data tables, divergence counts, visual patterns, and strategy suggestions dynamically.

**Live App**: https://stockbrain.averymiddlebrook2014.workers.dev/

This contains everything you need to run your app locally and deploy to Cloudflare Workers.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure API keys in `.env.local` (copy from `.env.local.example`):
   - At least one AI provider is required (Gemini, OpenAI, Claude, or OpenRouter)
   - Optional: Odds API key for sports betting data
3. Verify your configuration (optional):
   `npm run check-config`
4. Run the app:
   `npm run dev`

## API Configuration

StockBrain supports multiple AI providers. Configure at least one of the following:

### AI Providers (choose one or more)

- **Google Gemini** (Recommended): Set `VITE_GEMINI_API_KEY`
- **OpenAI**: Set `VITE_OPENAI_API_KEY`
- **Anthropic Claude**: Set `VITE_CLAUDE_API_KEY`
- **OpenRouter Models** (Free tiers available):
  - Qwen 3 Coder: `VITE_OPENROUTER_QWEN3_CODER_API_KEY`
  - DeepSeek Chat v3.1: `VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY`
  - DeepSeek R1-T2 Chimera: `VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY`
  - Minimax M2: `VITE_OPENROUTER_MINIMAX_M2_API_KEY`
  - GLM 4.5 Air: `VITE_OPENROUTER_GLM_45_AIR_API_KEY`
  - Qwen 3 235B: `VITE_OPENROUTER_QWEN3_235B_API_KEY`

### Optional APIs

- **Odds API**: Set `VITE_ODDS_API_KEY` for sports betting odds data

### Example Configuration

Copy `.env.local.example` to `.env.local` and add your API keys:

```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

The app will automatically use the first available provider in order of priority:
1. Gemini
2. OpenAI
3. Claude
4. OpenRouter models

## Deploy to Cloudflare Workers

StockBrain is configured to deploy to Cloudflare Workers using Wrangler.

**Prerequisites:** Wrangler CLI and a Cloudflare account

1. Install Wrangler globally (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Login to your Cloudflare account:
   ```bash
   wrangler login
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Configure API secrets (required for external LLM providers):
   ```bash
   # Set at least one AI provider API key
   wrangler secret put OPENAI_API_KEY
   wrangler secret put GEMINI_API_KEY
   wrangler secret put CLAUDE_API_KEY

   # Optional: OpenRouter models
   wrangler secret put OPENROUTER_QWEN3_CODER_API_KEY
   wrangler secret put OPENROUTER_DEEPSEEK_R1T2_API_KEY
   wrangler secret put OPENROUTER_DEEPSEEK_CHAT_API_KEY
   wrangler secret put OPENROUTER_MINIMAX_M2_API_KEY
   wrangler secret put OPENROUTER_GLM_45_AIR_API_KEY
   wrangler secret put OPENROUTER_QWEN3_235B_API_KEY
   ```

   When prompted, paste your API key and press Enter. You only need to configure the providers you plan to use.

5. Deploy to Cloudflare Workers:
   ```bash
   wrangler deploy
   ```

Your app will be deployed to a `*.workers.dev` subdomain. You can configure a custom domain in your Cloudflare dashboard.

### Configuration for Production

StockBrain uses a **secure API proxy architecture** where:
- **API keys are stored as Cloudflare secrets** (server-side only)
- The Cloudflare Worker acts as a secure proxy for all AI API calls
- External LLM providers (OpenAI, Claude, Gemini, OpenRouter) are accessed through the worker
- API keys are never exposed to the client-side code

#### Required Cloudflare Secrets

Configure at least one AI provider using `wrangler secret put`:

| Secret Name | Provider | Required |
|------------|----------|----------|
| `OPENAI_API_KEY` | OpenAI GPT-4o, GPT-4 Turbo | At least one |
| `GEMINI_API_KEY` | Google Gemini 1.5 Flash | At least one |
| `CLAUDE_API_KEY` | Anthropic Claude 3.x | At least one |
| `OPENROUTER_*` | OpenRouter models | Optional |

**Security Benefits:**
- API keys are never visible in client-side code
- All API calls are proxied through the worker
- Secrets are encrypted and managed by Cloudflare
- No risk of API key exposure in browser DevTools

## CI/CD Pipeline

StockBrain uses GitHub Actions for automated deployment to Cloudflare Workers.

- **Pull Requests:** Automatically build and validate the application
- **Main Branch:** Automatically build and deploy to production
- **Manual Deployment:** Trigger deployment via GitHub Actions

For detailed CI/CD setup instructions, see [CI_CD.md](CI_CD.md).

### Required Secrets

Configure these in GitHub repository settings for automated deployment:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
