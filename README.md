<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DCuAWQG-5ycJxiUtP5JfBvxFgloYnDUL

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
