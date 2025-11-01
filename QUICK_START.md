# Multi-Provider AI Setup - Quick Start

## ✅ What's Now Available

You now have **FULL** multi-provider AI support configured! Here's what you can use:

### **All 8 Providers Configured**:

1. ✅ **Google Gemini** - Best free tier
2. ✅ **Anthropic Claude** - Highest quality
3. ✅ **OpenAI GPT** - Most popular
4. ✅ **xAI Grok** - Latest features
5. ✅ **DeepSeek** - Best value
6. ✅ **Qwen** - Via OpenRouter
7. ✅ **GLM 4.5** - Via OpenRouter
8. ✅ **Minimax** - Via OpenRouter
9. ✅ **Cloudflare AI** - Always FREE

### **50+ Models Available**:
- Gemini 2.0 Flash, 1.5 Flash, 1.5 Pro
- Claude 3.5 Sonnet, 3.5 Haiku, 3 Opus
- GPT-4o, GPT-4o Mini, GPT-4 Turbo
- Grok Beta, Grok Vision
- DeepSeek Chat v3, DeepSeek R1
- Qwen 2.5 72B, Qwen Coder
- GLM 4.5 Air
- Minimax M2
- Llama 3.1 8B, 70B

---

## 🚀 How to Get ALL Providers Working

### **Option 1: ONE Key for Everything (EASIEST)** ⭐

Get **OpenRouter** - gives you access to **ALL** models with **ONE** API key:

```bash
# 1. Go to https://openrouter.ai/
# 2. Sign up (free)
# 3. Get API key from https://openrouter.ai/keys
# 4. Add to .env.local:

VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**What you get with this ONE key:**
- ✅ Grok (all models)
- ✅ Claude (all models)
- ✅ GPT-4 (all models)
- ✅ Gemini (all models)
- ✅ DeepSeek (FREE)
- ✅ Qwen (FREE)
- ✅ GLM (FREE)
- ✅ Minimax (FREE)
- ✅ 100+ other models

**Total setup time**: 2 minutes
**Cost**: FREE models available + pay-as-you-go

---

### **Option 2: Direct Provider Keys (BEST PERFORMANCE)**

Get API keys directly from each provider for lower latency:

```bash
# Add to .env.local:

# FREE - Best starting point
VITE_GEMINI_API_KEY=your_gemini_key          # https://ai.google.dev/

# Premium options
VITE_CLAUDE_API_KEY=your_claude_key           # https://console.anthropic.com/
VITE_OPENAI_API_KEY=your_openai_key           # https://platform.openai.com/
VITE_GROK_API_KEY=your_grok_key               # https://x.ai/api
VITE_DEEPSEEK_API_KEY=your_deepseek_key       # https://platform.deepseek.com/

# Plus OpenRouter for access to Qwen, GLM, Minimax
VITE_OPENROUTER_API_KEY=your_openrouter_key   # https://openrouter.ai/
```

---

### **Option 3: Hybrid Setup (RECOMMENDED FOR PRODUCTION)**

Combine FREE and paid options for best cost/performance:

```bash
# FREE tier for development/testing
VITE_GEMINI_API_KEY=your_gemini_key    # FREE: 15 requests/min

# OpenRouter for access to ALL models (including free ones)
VITE_OPENROUTER_API_KEY=your_key       # One key, all models

# Optional: Add premium providers for critical tasks
# VITE_CLAUDE_API_KEY=your_claude_key  # Best quality for important tasks
```

---

## 🎯 How Providers Work Together

### **Automatic Selection (Priority-Based)**

When you make a request, the app automatically selects the **first available** provider in this order:

1. **Gemini** → Best free tier
2. **Claude** → Highest quality (if configured)
3. **OpenAI** → Reliable, popular
4. **Grok** → Latest features
5. **DeepSeek** → Best value
6. **OpenRouter** → Access to all models
7. **Cloudflare AI** → Always available FREE backup

**Example**:
```typescript
// Your app does this automatically
const provider = getAvailableProvider();
// Returns first configured provider from priority list
```

---

### **Manual Provider Selection** (Coming Soon)

Provider selection UI is already configured in the code. You can:

```typescript
// Get all configured providers
const providers = getAllConfiguredProviders();
// Returns: [{ provider: 'gemini', apiKey: '...' }, { provider: 'openrouter', apiKey: '...' }]

// Get available models for a provider
const models = getAvailableModels('openrouter');
// Returns list of models with costs, features, context lengths

// Check if specific provider is available
if (isProviderConfigured('claude')) {
  // Use Claude
}
```

---

### **Load Balancing (DIY)**

You can implement load balancing across providers:

```typescript
// Example: Distribute requests across providers
const providers = ['gemini', 'openrouter', 'deepseek'];
let currentIndex = 0;

function getNextProvider() {
  const provider = providers[currentIndex];
  currentIndex = (currentIndex + 1) % providers.length;
  return provider;
}
```

---

### **Cost-Based Routing (DIY)**

Route by cost for different task types:

```typescript
function getProviderForTask(taskType: string) {
  switch(taskType) {
    case 'simple_chat':
      return 'gemini'; // FREE
    case 'analysis':
      return 'deepseek'; // $0.27/1M tokens
    case 'complex_reasoning':
      return 'claude'; // $3.00/1M tokens
    default:
      return 'openrouter'; // Flexible
  }
}
```

---

## 💰 Cost Breakdown

### **FREE Options** (Start Here!)

| Setup | Monthly Cost | What You Get |
|-------|-------------|--------------|
| **Gemini only** | $0 | 15 req/min, unlimited requests |
| **OpenRouter (free models)** | $0 | DeepSeek, Qwen, GLM, Minimax |
| **Cloudflare AI** | $0 | Llama 3.1 8B/70B, always available |
| **Combined FREE** | $0 | All of the above! |

### **Low Budget** ($10-50/month)

```bash
# Setup:
VITE_GEMINI_API_KEY=...        # FREE tier for most requests
VITE_OPENROUTER_API_KEY=...    # FREE models + cheap paid options

# Cost for 10,000 requests/month (500 tokens each):
# - Gemini: $0 (free tier covers it)
# - DeepSeek via OpenRouter: $1-5
# Total: $1-5/month
```

### **Medium Budget** ($50-200/month)

```bash
# Setup:
VITE_GEMINI_API_KEY=...        # Paid tier
VITE_OPENROUTER_API_KEY=...    # All models
VITE_CLAUDE_API_KEY=...        # Haiku for quality tasks

# Cost for 100,000 requests/month (1,000 tokens each):
# - Gemini Flash: $30-50
# - Claude Haiku (20% of requests): $40
# - DeepSeek (remaining): $10
# Total: $80-100/month
```

### **High Budget** ($200-1,000+/month)

```bash
# Setup:
VITE_CLAUDE_API_KEY=...        # Sonnet for best quality
VITE_OPENAI_API_KEY=...        # GPT-4o for variety
VITE_GEMINI_API_KEY=...        # Flash for high volume
VITE_OPENROUTER_API_KEY=...    # Backup + free models

# Cost for 1,000,000 requests/month:
# - Smart routing based on task type
# - Claude Sonnet (10%): $400
# - GPT-4o (20%): $500
# - Gemini Flash (70%): $150
# Total: $1,050/month
```

---

## 📊 Model Selection Guide

### **Choose by Use Case**

| Use Case | Best Model | Cost | Provider |
|----------|-----------|------|----------|
| **Simple chat** | Gemini 2.0 Flash | FREE | Gemini |
| **Code generation** | DeepSeek Chat v3 | FREE | OpenRouter |
| **Complex reasoning** | Claude 3.5 Sonnet | $3/$15 | Claude/OpenRouter |
| **Image analysis** | GPT-4o | $2.5/$10 | OpenAI/OpenRouter |
| **Long context** | Gemini 1.5 Pro | $1.25/$5 | Gemini |
| **Latest features** | Grok Beta | $5/$15 | Grok/OpenRouter |
| **Best value** | DeepSeek V3 | $0.27/$1.10 | DeepSeek |
| **Emergency backup** | Llama 3.1 8B | FREE | Cloudflare AI |

---

## 🔧 Quick Setup Steps

### **1. Create .env.local**

```bash
cp .env.local.example .env.local
```

### **2. Choose Your Strategy**

#### **Strategy A: FREE (Best for Getting Started)**
```bash
# Edit .env.local:
VITE_GEMINI_API_KEY=AIzaSy...your_key_here
```
Get key: https://ai.google.dev/

#### **Strategy B: OpenRouter (Best for Production)**
```bash
# Edit .env.local:
VITE_OPENROUTER_API_KEY=sk-or-v1-...your_key_here
```
Get key: https://openrouter.ai/keys

#### **Strategy C: Multi-Provider (Maximum Power)**
```bash
# Edit .env.local:
VITE_GEMINI_API_KEY=AIzaSy...
VITE_CLAUDE_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

### **3. Start the App**

```bash
npm run dev
```

### **4. Verify Providers**

Open browser console and check:
```javascript
// Your app will log which provider is being used
console.log('Using provider:', getAvailableProvider());
```

---

## 🎮 Advanced: Using Specific Models

### **Access Model Information**

```typescript
import { getAvailableModels, getDefaultModel } from './services/apiConfig';

// Get all models for OpenRouter
const models = getAvailableModels('openrouter');
/* Returns:
[
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat v3 (FREE)',
    provider: 'openrouter',
    contextLength: 64000,
    inputCost: 0,
    outputCost: 0,
    features: ['streaming']
  },
  ...
]
*/

// Get default model for provider
const defaultModel = getDefaultModel('claude');
// Returns: Claude 3.5 Sonnet (first in list)
```

---

## 📚 Documentation

- **Full Guide**: `AI_PROVIDERS_GUIDE.md` - Complete cost breakdowns, provider comparison
- **Cloudflare Setup**: `CLOUDFLARE_GUIDE.md` - Workers AI, bindings, deployment
- **General Setup**: `SETUP_GUIDE.md` - Getting started, mock data, troubleshooting
- **Environment Template**: `.env.local.example` - All providers with comments

---

## ❓ FAQ

### **Q: Can I use multiple providers at once?**
A: Yes! Configure multiple providers and the app will use the first available one based on priority. You can also implement custom load balancing.

### **Q: Do I need ALL the API keys?**
A: No! You only need **ONE**:
- **Best FREE**: `VITE_GEMINI_API_KEY`
- **Best for ALL models**: `VITE_OPENROUTER_API_KEY`
- **Best quality**: `VITE_CLAUDE_API_KEY`

### **Q: What's the cheapest option?**
A: **FREE options**:
1. Gemini (free tier)
2. OpenRouter (free models: DeepSeek, Qwen, GLM, Minimax)
3. Cloudflare AI (always free)

### **Q: How do I access Grok, Qwen, GLM, Minimax?**
A: Use **OpenRouter** - one API key gives you access to ALL of them:
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### **Q: Which provider has the best quality?**
A: **Claude 3.5 Sonnet** (highest quality, $3/$15 per 1M tokens)

### **Q: Which provider is the best value?**
A: **DeepSeek V3** ($0.27/$1.10 per 1M tokens, excellent quality)

### **Q: Can I switch providers mid-session?**
A: Currently uses automatic priority-based selection. Provider selection UI can be added if needed.

### **Q: What if all my providers go down?**
A: **Cloudflare AI** is always available as a FREE backup (no API key needed).

---

## 🎯 Recommended Setups

### **Beginner**
```bash
VITE_GEMINI_API_KEY=your_key
# Cost: $0, Quality: ⭐⭐⭐⭐⭐
```

### **Hobbyist**
```bash
VITE_OPENROUTER_API_KEY=your_key
# Cost: $0-20/month, Quality: ⭐⭐⭐⭐⭐
# Access: ALL models
```

### **Professional**
```bash
VITE_GEMINI_API_KEY=your_key
VITE_CLAUDE_API_KEY=your_key
VITE_OPENROUTER_API_KEY=your_key
# Cost: $50-200/month, Quality: ⭐⭐⭐⭐⭐
# Access: ALL models + priority providers
```

### **Enterprise**
```bash
VITE_GEMINI_API_KEY=your_key
VITE_CLAUDE_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_GROK_API_KEY=your_key
VITE_DEEPSEEK_API_KEY=your_key
VITE_OPENROUTER_API_KEY=your_key
# Cost: $200-1,000+/month, Quality: ⭐⭐⭐⭐⭐
# Access: Everything + failover + load balancing
```

---

## 🚀 Next Steps

1. **Get API keys** (choose your strategy above)
2. **Add to `.env.local`**
3. **Run `npm run dev`**
4. **Start building!**

For detailed cost breakdowns and provider comparison, see **AI_PROVIDERS_GUIDE.md**.
