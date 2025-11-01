# StockBrain Setup Guide

This guide will help you get StockBrain running locally with mock data for testing.

## What is StockBrain?

StockBrain is an **AI-powered stock analysis platform** that enables conversational stock analysis through:
- Natural language chat interface
- 10 different analysis features (divergence, ghost patterns, options strategies, etc.)
- Interactive charts and widgets
- Multi-modal input (text, images, voice)

**Current Status**: Uses demo/mock data for stock information. AI analysis is fully functional.

---

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Get a FREE API Key

You need at least ONE AI provider API key. We recommend **Google Gemini** (free tier available):

1. Visit: https://ai.google.dev/
2. Click "Get API Key"
3. Create a new API key
4. Copy the key

### Step 3: Configure Environment Variables

The `.env.local` file has been created for you. Edit it and add your API key:

```bash
# Open the file in your editor
nano .env.local  # or use your favorite editor

# Replace this line:
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# With your actual key:
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### Step 4: Start the Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Understanding the Architecture

### Frontend (React + TypeScript)
- **App.tsx** - Main application component
- **components/** - UI components (charts, widgets, chat interface)
- **services/geminiService.ts** - AI integration layer
- **lib/api/stockAPI.ts** - Stock data API (NOW HAS MOCK DATA!)

### Backend (Cloudflare Workers)
- **api/index.ts** - API proxy for AI requests
- **worker.ts** - Cloudflare Worker entry point
- Handles AI model requests and serves static assets

### Data Flow
```
User Input → Chat/Toolbox → geminiService → /api/* endpoints → AI Model → Response → Widgets
```

---

## API Requirements Explained

### 1. AI Provider APIs (REQUIRED)

**You MUST have at least ONE of these:**

| Provider | Variable | Get Key From | Cost | Status |
|----------|----------|--------------|------|--------|
| **Gemini** (Recommended) | `VITE_GEMINI_API_KEY` | https://ai.google.dev/ | FREE tier | Fully supported |
| OpenAI | `VITE_OPENAI_API_KEY` | https://platform.openai.com/ | Pay per use | Config ready |
| Claude | `VITE_CLAUDE_API_KEY` | https://console.anthropic.com/ | Pay per use | Config ready |
| OpenRouter | `VITE_OPENROUTER_*_API_KEY` | https://openrouter.ai/ | FREE models | Config ready |

**What these do:**
- Power the chat interface
- Generate stock analysis
- Process natural language queries
- Analyze uploaded images
- Create dynamic widgets

### 2. Stock Market Data APIs (OPTIONAL - NOT NEEDED YET)

**Currently using MOCK DATA - these are for future real data integration:**

| Provider | Purpose | Get Key From | Cost |
|----------|---------|--------------|------|
| Alpha Vantage | Real-time quotes, historical data | https://www.alphavantage.co/ | FREE tier |
| Finnhub | Stock data, news, fundamentals | https://finnhub.io/ | FREE tier |
| IEX Cloud | Market data, company info | https://iexcloud.io/ | Paid |

**What these would do:**
- Provide real-time stock quotes
- Supply historical price data
- Fetch company fundamentals
- Retrieve financial news

**Current Implementation:**
The `lib/api/stockAPI.ts` file now contains mock data for:
- AAPL, TSLA, NVDA, MSFT, GOOGL (and more)
- Real-time quotes (simulated)
- Intraday price data (generated)
- Company profiles
- Symbol search

### 3. Optional APIs

| API | Variable | Purpose | Get Key From |
|-----|----------|---------|--------------|
| Odds API | `VITE_ODDS_API_KEY` | Sports betting data | https://the-odds-api.com/ |

---

## Mock Data Available

I've created comprehensive mock data for testing. Here's what's available:

### Stock Quotes
```typescript
// Pre-configured companies with realistic data:
- AAPL (Apple Inc.) - $178.52
- TSLA (Tesla Inc.) - $242.84
- NVDA (NVIDIA) - $875.28
- MSFT (Microsoft) - $415.67
- GOOGL (Alphabet) - $142.38
```

### Company Profiles
Full company information including:
- Company description
- Sector and industry
- CEO name
- Employee count
- Website and exchange

### Intraday Data
Automatically generated realistic price movements with:
- 30 data points
- OHLC (Open, High, Low, Close) values
- Volume data
- Timestamp information

### Symbol Search
Search functionality for:
AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META, AMD, NFLX, DIS

---

## Testing the Application

### 1. Test the Chat Interface
- Open the app at http://localhost:3000
- Type: "Tell me about Apple stock"
- The AI will analyze and respond

### 2. Test Analysis Features
Click any of the 10 feature buttons in the toolbox:
- **Divergence Analysis** - Shows bullish/bearish patterns
- **Ghost Pattern** - Correlation analysis
- **Options Strategy** - Trading strategies
- **Financial News** - Latest news
- **Company Profile** - Company information
- **Peer Comparison** - Compare with competitors
- **Sentiment Analysis** - Market sentiment
- **Technical Indicators** - RSI, MACD, etc.
- **Earnings Analysis** - Earnings reports
- **Market Overview** - General trends

### 3. Test Stock Selection
- Use the stock symbol selector in the toolbox
- Add/remove symbols
- Select different stocks to analyze

### 4. Test Image Analysis
- Click the image upload button in chat
- Upload a screenshot of a stock chart
- The AI will analyze the image

---

## Troubleshooting

### "No AI provider API key found" Error
**Solution:**
1. Verify `.env.local` file exists in the root directory
2. Check that you added a valid API key
3. Ensure variable name is correct (e.g., `VITE_GEMINI_API_KEY`)
4. **RESTART the dev server** after changing `.env.local`

### "Failed to fetch" or Network Errors
**Solution:**
1. Check if the dev server is running
2. Verify you're accessing http://localhost:3000
3. Check browser console for detailed errors
4. Ensure your API key is valid and active

### API Rate Limits
**Solution:**
- Gemini free tier has generous limits
- If you hit limits, wait a few minutes
- Consider upgrading to paid tier for production use

### Mock Data Not Showing
**Solution:**
- Mock data is automatically used
- Check browser console for errors
- Verify `lib/api/stockAPI.ts` has been updated
- Try refreshing the page

---

## Next Steps

### For Development:
1. **Explore the codebase**:
   - `App.tsx` - Main application logic
   - `components/` - UI components
   - `services/geminiService.ts` - AI integration

2. **Customize mock data**:
   - Edit `lib/api/stockAPI.ts`
   - Add more companies
   - Modify price ranges

3. **Add real stock data**:
   - Get Alpha Vantage API key (free)
   - Implement real API calls in `stockAPI.ts`
   - Replace mock data with live data

### For Deployment:
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Workers**:
   ```bash
   wrangler deploy
   ```

3. **Configure GitHub Actions** (already set up):
   - Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets
   - Add `CLOUDFLARE_ACCOUNT_ID` to GitHub Secrets
   - Push to `main` branch for auto-deployment

---

## File Structure Reference

```
StockBrain/
├── .env.local              # YOUR API KEYS (don't commit!)
├── App.tsx                 # Main application
├── types.ts                # TypeScript definitions
├── package.json            # Dependencies
├── vite.config.ts          # Build configuration
├── wrangler.toml           # Cloudflare Worker config
│
├── api/
│   └── index.ts            # API proxy endpoints
│
├── components/
│   ├── ChatInput.tsx       # Chat input component
│   ├── ChatMessage.tsx     # Message display
│   ├── Toolbox.tsx         # Stock selector & features
│   ├── StockDivergenceChart.tsx
│   ├── GhostPatternChart.tsx
│   └── OptionsStrategyCard.tsx
│
├── services/
│   ├── geminiService.ts    # AI service integration
│   └── apiConfig.ts        # Multi-provider config
│
├── lib/
│   ├── api/
│   │   └── stockAPI.ts     # Stock data API (NOW WITH MOCK DATA!)
│   ├── constants/
│   │   └── index.ts        # App constants
│   └── utils/
│       └── formatters.ts   # Utility functions
│
└── .github/
    └── workflows/
        ├── deploy.yml      # Auto-deployment
        └── pr-checks.yml   # PR validation
```

---

## Security Notes

### API Keys
- **NEVER commit** `.env.local` to git (already in `.gitignore`)
- **Don't share** API keys publicly
- **Rotate keys** if you suspect compromise
- **Use separate keys** for dev/staging/production

### Client-Side API Keys
⚠️ **IMPORTANT**: API keys in `.env.local` are embedded in the client-side bundle at build time. This means they're visible in the browser.

**For production:**
- Implement a backend API proxy
- Keep API keys server-side only
- Use rate limiting and request validation
- Consider Cloudflare Workers for this

---

## Getting Help

### Resources:
- **Documentation**: Check the `*.md` files in the root directory
- **API Docs**: See `API_INTEGRATION.md`
- **Architecture**: See `ARCHITECTURE.md`
- **CI/CD**: See `CI_CD.md`

### Common Issues:
1. **Build failures**: Run `npm install` again
2. **Type errors**: Ensure TypeScript is installed
3. **Port conflicts**: Change port in `vite.config.ts`

---

## What's Working vs. What's Not

### ✅ Working (Ready to Test):
- AI chat interface
- 10 analysis features
- Mock stock data
- Image analysis
- Voice recording
- Multiple AI providers
- CI/CD deployment
- Mobile responsive UI

### ❌ Not Implemented Yet:
- Real stock market data integration
- User authentication
- Data persistence (localStorage)
- Rate limiting
- Offline mode detection
- Advanced error handling
- Custom stock watchlists

---

## Summary

You now have:
1. ✅ `.env.local` file ready for your API key
2. ✅ Mock stock data implementation
3. ✅ Full setup instructions
4. ✅ Troubleshooting guide

**Next Action:** Get your FREE Gemini API key and start the app!

```bash
# 1. Get API key: https://ai.google.dev/
# 2. Add it to .env.local
# 3. Run the app:
npm run dev
```

Happy coding! 🚀
