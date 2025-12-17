# StockCommand API Integration Guide

This document is the definitive reference for all third-party integrations required to run StockCommand. For the application to function fully (Agents + Trading + Billing), you must configure the relevant services.

## 1. Core AI Providers (Required)
StockCommand's "Brain" relies on LLMs. You must provide at least one.

### Google Gemini (Recommended)
- **Env Var**: `VITE_GEMINI_API_KEY`
- **Purpose**: Main logic, reasoning, and conversational agent.
- **Get Key**: [Google AI Studio](https://ai.google.dev/)
- **Cost**: Free tier available.

### OpenAI (Alternative)
- **Env Var**: `VITE_OPENAI_API_KEY`
- **Purpose**: Fallback or specialized agents.
- **Get Key**: [OpenAI Platform](https://platform.openai.com/)

### OpenRouter (Various Models)
- **Env Vars**: 
  - `VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY` (Economic reasoning)
  - `VITE_OPENROUTER_QWEN3_CODER_API_KEY` (Code generation)
- **Purpose**: Access to DeepSeek, Qwen, Llama.
- **Get Key**: [OpenRouter](https://openrouter.ai/)

---

## 2. Brokerage Integrations (Trading)
To enable the "Command Center" and actual trading, integrate one or more brokers.

### Alpaca (Crypto & Stocks)
**Status**: Ready for Configuration
- **Type**: OAuth Application (Commission-free)
- **Env Vars**:
  - `ALPACA_CLIENT_ID` (From Alpaca App Dashboard)
  - `ALPACA_CLIENT_SECRET` (From Alpaca App Dashboard)
  - `ALPACA_REDIRECT_URI` (e.g., `https://your-worker.dev/api/brokers/callback`)
- **Get Keys**: [Alpaca Broker API](https://alpaca.markets/broker-api)
- **Note**: You must create an OAuth App in Alpaca to allow users to connect.

### Interactive Brokers (Global Multi-Asset)
**Status**: Ready for Configuration
- **Type**: Third-Party Integration (OAuth)
- **Env Vars**:
  - `IBKR_CLIENT_ID`
  - `IBKR_CLIENT_SECRET`
  - `IBKR_REDIRECT_URI`
- **Get Keys**: [IBKR Third Party Integration](https://www.interactivebrokers.com/en/trading/api-solutions.php)
- **Note**: Requires approval from IBKR. Supports "Zero Skill" Client Portal API.

### Tradier (Options Focused)
**Status**: Planned
- **Type**: OAuth
- **Env Vars**: `TRADIER_ACCESS_TOKEN` (Future)

---

## 3. Payment Processing (Agent Fuel)
Required for the "Agent Fuel" credit system.

### Stripe
**Status**: Live
- **Env Vars (Worker)**:
  - `STRIPE_SECRET_KEY` (Secret Key `sk_...`)
  - `STRIPE_WEBHOOK_SECRET` (Webhook Signing Secret `whsec_...`)
- **Env Vars (Frontend)**:
  - `VITE_STRIPE_PUBLISHABLE_KEY` (Public Key `pk_...`)
- **Get Keys**: [Stripe Dashboard](https://dashboard.stripe.com/)
- **Note**: Ensure Webhook endpoint is configured to `https://your-worker.dev/api/stripe/webhook`.

---

## 4. Infrastructure

### Cloudflare
- **Services**: D1 (Database), Workers (Backend), KV (Sessions).
- **Configuration**: Managed via `wrangler.toml`.

---

## Environment Setup Checklist

Create a `.dev.vars` file for backend (Worker) secrets and `.env.local` for frontend.

**Frontend (`.env.local`)**:
```bash
VITE_GEMINI_API_KEY=AIza...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test...
```

**Backend (`.dev.vars` or Cloudflare Secrets)**:
```bash
STRIPE_SECRET_KEY=sk_test...
STRIPE_WEBHOOK_SECRET=whsec_...
ALPACA_CLIENT_ID=...
ALPACA_CLIENT_SECRET=...
IBKR_CLIENT_ID=...
IBKR_CLIENT_SECRET=...
```
