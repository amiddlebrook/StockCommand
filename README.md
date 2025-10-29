<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StockBrain - AI Stock Analyzer

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

4. Deploy to Cloudflare Workers:
   ```bash
   wrangler deploy
   ```

Your app will be deployed to a `*.workers.dev` subdomain. You can configure a custom domain in your Cloudflare dashboard.

### Configuration for Production

For production deployments, you'll need to configure environment variables:
- API keys are embedded at build time via Vite's environment variable system
- Make sure your `.env.local` (or build-time environment) contains all necessary API keys before running `npm run build`
- The built static assets are served by the Cloudflare Worker defined in `worker.ts`

**Security Note:** API keys embedded at build time will be visible in the client-side JavaScript bundle. For improved security, consider implementing a backend API proxy that keeps API keys server-side. The current architecture uses client-side API calls for simplicity.
