# Complete AI Providers Guide for StockBrain

This guide explains how to use **ALL** major AI providers (Grok, Gemini, Claude, OpenAI, DeepSeek, Qwen, GLM, Minimax) with StockBrain, with detailed cost breakdowns and setup instructions.

---

## 🎯 Two Approaches: Direct vs OpenRouter

### **Approach 1: OpenRouter (RECOMMENDED)** ⭐

**One API key. Access to ALL models.**

OpenRouter is an AI aggregator that gives you access to 100+ models from different providers through a single API key.

**Benefits**:
- ✅ **One API key** for all models
- ✅ **Unified billing** - pay for what you use
- ✅ **Free models** available (DeepSeek, Qwen, GLM, Minimax)
- ✅ **No rate limits** on paid models
- ✅ **Automatic failover** between providers
- ✅ **Easy to switch** between models

**Get Started**:
1. Go to https://openrouter.ai/
2. Sign up (free account)
3. Get your API key from https://openrouter.ai/keys
4. Add to `.env.local`: `VITE_OPENROUTER_API_KEY=your_key_here`

### **Approach 2: Direct Providers**

Get API keys directly from each provider. More control, but more setup.

**Benefits**:
- ✅ **Lower latency** (no middleman)
- ✅ **Official support** from each provider
- ✅ **Higher rate limits** on some providers
- ✅ **Beta features** first

**Drawbacks**:
- ❌ Multiple API keys to manage
- ❌ Multiple billing accounts
- ❌ Different APIs to integrate
- ❌ Rate limits per provider

---

## 💰 Complete Cost Breakdown

### **FREE Options** (Start Here!)

| Provider | Model | Cost | Quality | Use For |
|----------|-------|------|---------|---------|
| **Cloudflare AI** | Llama 3.1 8B | FREE (10k neurons/day) | Good | Chat, basic analysis |
| **OpenRouter** | DeepSeek Chat v3 | FREE | Excellent | General use, coding |
| **OpenRouter** | Qwen 2.5 72B | FREE | Excellent | Analysis, reasoning |
| **OpenRouter** | GLM 4.5 Air | FREE | Good | Multilingual |
| **OpenRouter** | Minimax M2 | FREE | Good | Chinese models |
| **Gemini** | Gemini 2.0 Flash | FREE (15 req/min) | Excellent | Best free option |
| **Gemini** | Gemini 1.5 Flash | FREE (15 req/min) | Very good | Fast responses |

**Recommendation**: Start with **Gemini 2.0 Flash** (best free model) + **OpenRouter** (free DeepSeek/Qwen).

---

### **OpenRouter Pricing** (Pay As You Go)

All prices are per **1 million tokens** (roughly 750,000 words).

#### **Tier 1: FREE Models** ($0.00)

| Model | Input | Output | Quality | Speed |
|-------|-------|--------|---------|-------|
| **DeepSeek Chat v3** | $0.00 | $0.00 | ⭐⭐⭐⭐⭐ | Fast |
| **Qwen 2.5 72B** | $0.00 | $0.00 | ⭐⭐⭐⭐⭐ | Medium |
| **GLM 4.5 Air** | $0.00 | $0.00 | ⭐⭐⭐⭐ | Fast |
| **Minimax M2** | $0.00 | $0.00 | ⭐⭐⭐⭐ | Fast |
| **Qwen 2.5 Coder 32B** | $0.00 | $0.00 | ⭐⭐⭐⭐ | Medium |

**Best for**: Testing, development, high-volume low-cost use

#### **Tier 2: Budget Models** ($0.10 - $1.00 per 1M tokens)

| Model | Input | Output | Quality | Speed |
|-------|-------|--------|---------|-------|
| **DeepSeek R1** | $0.55 | $2.19 | ⭐⭐⭐⭐⭐ | Slow (reasoning) |
| **Gemini 1.5 Flash** | $0.075 | $0.30 | ⭐⭐⭐⭐⭐ | Very fast |
| **Gemini 2.0 Flash Exp** | $0.00 | $0.00 | ⭐⭐⭐⭐⭐ | Very fast |
| **Claude 3.5 Haiku** | $1.00 | $5.00 | ⭐⭐⭐⭐⭐ | Very fast |
| **GPT-4o Mini** | $0.15 | $0.60 | ⭐⭐⭐⭐ | Fast |

**Best for**: Production apps with moderate traffic

#### **Tier 3: Premium Models** ($3.00 - $15.00 per 1M tokens)

| Model | Input | Output | Quality | Speed |
|-------|-------|--------|---------|-------|
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | ⭐⭐⭐⭐⭐ | Medium |
| **GPT-4o** | $2.50 | $10.00 | ⭐⭐⭐⭐⭐ | Medium |
| **Gemini 1.5 Pro** | $1.25 | $5.00 | ⭐⭐⭐⭐⭐ | Medium |
| **Claude 3 Opus** | $15.00 | $75.00 | ⭐⭐⭐⭐⭐ | Slow |

**Best for**: Critical tasks requiring highest quality

#### **Tier 4: Specialized Models**

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| **Grok 2 Vision** | $2.00 | $10.00 | Image analysis |
| **Grok Beta** | $5.00 | $15.00 | Latest features |
| **GPT-4 Turbo** | $10.00 | $30.00 | Legacy GPT-4 |

---

### **Direct Provider Pricing**

#### **1. Google Gemini** (BEST FREE OPTION)

| Model | Input (1M tokens) | Output (1M tokens) | Rate Limit (Free) | Quality |
|-------|-------------------|-------------------|-------------------|---------|
| **Gemini 2.0 Flash Exp** | FREE | FREE | 10 RPM, 1500 RPD | ⭐⭐⭐⭐⭐ |
| **Gemini 1.5 Flash** | FREE | FREE | 15 RPM, 1500 RPD | ⭐⭐⭐⭐⭐ |
| **Gemini 1.5 Flash-8B** | FREE | FREE | 15 RPM, 1500 RPD | ⭐⭐⭐⭐ |
| **Gemini 1.5 Pro** | FREE | FREE | 2 RPM, 50 RPD | ⭐⭐⭐⭐⭐ |

**Paid Tier** (Pay-as-you-go):
- Flash: $0.075 input / $0.30 output
- Pro: $1.25 input / $5.00 output

**Get API Key**: https://ai.google.dev/

**Best for**: Free tier is incredibly generous. Best starting point.

---

#### **2. Anthropic Claude** (HIGHEST QUALITY)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | ⭐⭐⭐⭐⭐ |
| **Claude 3.5 Haiku** | $1.00 | $5.00 | ⭐⭐⭐⭐⭐ |
| **Claude 3 Opus** | $15.00 | $75.00 | ⭐⭐⭐⭐⭐ |

**No free tier** - $5 minimum credit purchase required

**Get API Key**: https://console.anthropic.com/

**Best for**: Complex reasoning, long context (200k tokens), high-quality outputs

---

#### **3. OpenAI** (MOST POPULAR)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **GPT-4o** | $2.50 | $10.00 | ⭐⭐⭐⭐⭐ |
| **GPT-4o Mini** | $0.15 | $0.60 | ⭐⭐⭐⭐ |
| **GPT-4 Turbo** | $10.00 | $30.00 | ⭐⭐⭐⭐⭐ |
| **o1-preview** | $15.00 | $60.00 | ⭐⭐⭐⭐⭐ (reasoning) |

**Free trial**: $5 credit for new users (expires after 3 months)

**Get API Key**: https://platform.openai.com/api-keys

**Best for**: Established ecosystem, many tools, good documentation

---

#### **4. xAI Grok** (NEWEST)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **Grok Beta** | $5.00 | $15.00 | ⭐⭐⭐⭐⭐ |
| **Grok 2 Vision** | $2.00 | $10.00 | ⭐⭐⭐⭐ |

**No free tier** - Direct API access only

**Get API Key**: https://x.ai/api (requires X Premium+ subscription)

**Best for**: Latest features, real-time web search, X integration

---

#### **5. DeepSeek** (BEST VALUE)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **DeepSeek V3** | $0.27 | $1.10 | ⭐⭐⭐⭐⭐ |
| **DeepSeek R1** | $0.55 | $2.19 | ⭐⭐⭐⭐⭐ (reasoning) |

**FREE via OpenRouter** (rate limited)

**Direct API**: https://platform.deepseek.com/

**Best for**: Best quality-to-cost ratio, excellent for coding

---

#### **6. Alibaba Qwen** (MULTILINGUAL)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **Qwen 2.5 72B** | FREE | FREE | ⭐⭐⭐⭐⭐ |
| **Qwen 2.5 Coder 32B** | FREE | FREE | ⭐⭐⭐⭐ |
| **Qwen Max** | $0.80 | $2.40 | ⭐⭐⭐⭐⭐ |

**FREE via OpenRouter**

**Direct API**: https://dashscope.aliyun.com/

**Best for**: Chinese language, coding, multilingual tasks

---

#### **7. Zhipu GLM** (CHINESE ALTERNATIVE)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **GLM 4.5 Air** | FREE | FREE | ⭐⭐⭐⭐ |
| **GLM 4 Plus** | $0.50 | $1.50 | ⭐⭐⭐⭐⭐ |

**FREE via OpenRouter**

**Direct API**: https://open.bigmodel.cn/

**Best for**: Chinese language, vision tasks

---

#### **8. Minimax** (CHINESE MULTIMODAL)

| Model | Input (1M tokens) | Output (1M tokens) | Quality |
|-------|-------------------|-------------------|---------|
| **Minimax M2** | FREE | FREE | ⭐⭐⭐⭐ |

**FREE via OpenRouter**

**Direct API**: https://platform.minimaxi.com/

**Best for**: Chinese language, voice/video generation

---

## 📊 Cost Examples (Real Usage)

### **Scenario 1: Light Use** (100 requests/day, 500 tokens each)

| Provider | Monthly Tokens | Monthly Cost |
|----------|---------------|--------------|
| **Gemini Flash (Free)** | 15M | **$0** |
| **OpenRouter (DeepSeek Free)** | 15M | **$0** |
| **Cloudflare AI** | 15M | **$0** |
| **Claude Haiku** | 15M | **$60** |
| **GPT-4o Mini** | 15M | **$9** |

**Recommendation**: Use FREE options (Gemini or DeepSeek via OpenRouter)

---

### **Scenario 2: Medium Use** (1,000 requests/day, 1,000 tokens each)

| Provider | Monthly Tokens | Monthly Cost |
|----------|---------------|--------------|
| **Gemini Flash (Paid)** | 300M | **$67.50** |
| **DeepSeek V3** | 300M | **$196.50** |
| **Claude Haiku** | 300M | **$1,200** |
| **GPT-4o Mini** | 300M | **$180** |
| **Claude Sonnet** | 300M | **$3,600** |

**Recommendation**: Gemini Flash (best value) or DeepSeek V3 (best quality/cost)

---

### **Scenario 3: High Use** (10,000 requests/day, 2,000 tokens each)

| Provider | Monthly Tokens | Monthly Cost |
|----------|---------------|--------------|
| **Gemini Flash** | 6,000M (6B) | **$1,350** |
| **DeepSeek V3** | 6,000M | **$3,930** |
| **Claude Haiku** | 6,000M | **$24,000** |
| **GPT-4o** | 6,000M | **$50,000** |
| **Claude Sonnet** | 6,000M | **$72,000** |

**Recommendation**: Gemini Flash or use multiple providers with load balancing

---

## 🎯 Recommended Configurations

### **1. Best FREE Setup** (No Cost)

```bash
# .env.local
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
```

**Strategy**:
- Use Gemini Flash for most requests (free tier)
- Fallback to OpenRouter DeepSeek (free) when rate limited
- Cloudflare AI as emergency backup

**Monthly Cost**: $0
**Quality**: ⭐⭐⭐⭐⭐

---

### **2. Best VALUE Setup** (Low Cost, High Quality)

```bash
# .env.local
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
```

**Strategy**:
- Use Gemini Flash (paid tier) for main traffic
- Use DeepSeek V3 via OpenRouter for complex tasks
- Use Claude Haiku for critical reasoning

**Monthly Cost**: ~$100-500 (moderate traffic)
**Quality**: ⭐⭐⭐⭐⭐

---

### **3. Best QUALITY Setup** (Premium)

```bash
# .env.local
VITE_CLAUDE_API_KEY=your_claude_key_here
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

**Strategy**:
- Use Claude Sonnet for complex analysis
- Use GPT-4o for general tasks
- Use Gemini for high-volume cheap tasks

**Monthly Cost**: $500-5,000+
**Quality**: ⭐⭐⭐⭐⭐

---

### **4. Multi-Provider Setup** (All Options)

```bash
# .env.local
# Primary providers
VITE_GEMINI_API_KEY=your_gemini_key
VITE_CLAUDE_API_KEY=your_claude_key
VITE_OPENAI_API_KEY=your_openai_key

# OpenRouter (one key for all models)
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Optional: Direct Grok access
VITE_GROK_API_KEY=your_grok_key

# Cloudflare AI (FREE, built-in)
# No key needed - automatically available
```

**Strategy**:
- Let user choose provider per request
- Automatic failover if one provider is down
- Load balance across providers
- Use cheapest model for each task type

**Monthly Cost**: Variable ($0 - $5,000+)
**Quality**: ⭐⭐⭐⭐⭐

---

## 🔧 Setup Instructions

### **Step 1: Get OpenRouter API Key** (Recommended)

1. Go to https://openrouter.ai/
2. Click **Sign In** (can use Google/GitHub)
3. Go to https://openrouter.ai/keys
4. Click **Create Key**
5. Copy the key (starts with `sk-or-v1-...`)
6. Add to `.env.local`:
   ```bash
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

**This ONE key gives you access to**:
- ✅ Grok (all models)
- ✅ Claude (all models)
- ✅ GPT-4 (all models)
- ✅ Gemini (all models)
- ✅ DeepSeek (FREE)
- ✅ Qwen (FREE)
- ✅ GLM (FREE)
- ✅ Minimax (FREE)
- ✅ 100+ other models

---

### **Step 2: Get Direct Provider Keys** (Optional)

#### **Gemini** (Best Free Option)

1. Go to https://ai.google.dev/
2. Click **Get API Key in Google AI Studio**
3. Click **Create API Key**
4. Copy the key
5. Add to `.env.local`:
   ```bash
   VITE_GEMINI_API_KEY=AIzaSy...your-key-here
   ```

#### **Claude** (Highest Quality)

1. Go to https://console.anthropic.com/
2. Sign up (requires phone number)
3. Go to **API Keys** → **Create Key**
4. Copy the key
5. Add to `.env.local`:
   ```bash
   VITE_CLAUDE_API_KEY=sk-ant-...your-key-here
   ```
6. Add $5 minimum credit

#### **OpenAI** (Most Popular)

1. Go to https://platform.openai.com/signup
2. Verify email and phone
3. Go to https://platform.openai.com/api-keys
4. Click **Create new secret key**
5. Copy the key
6. Add to `.env.local`:
   ```bash
   VITE_OPENAI_API_KEY=sk-...your-key-here
   ```
7. Add payment method

#### **Grok** (Latest)

1. Go to https://x.ai/api
2. Subscribe to X Premium+ ($16/month)
3. Get API access
4. Copy your API key
5. Add to `.env.local`:
   ```bash
   VITE_GROK_API_KEY=your-grok-key-here
   ```

---

### **Step 3: Configure Provider Selection**

Your app will automatically detect which providers are configured and let you choose between them.

**Priority order** (if not manually selected):
1. Claude Sonnet (if available) - highest quality
2. GPT-4o (if available) - popular choice
3. Gemini Flash (if available) - best free option
4. DeepSeek via OpenRouter (if available) - best value
5. Cloudflare AI (always available) - backup

---

## 🎚️ Provider Selection Strategies

### **Strategy 1: Cost-Based Routing**

```typescript
// Route by cost
const getProviderForTask = (taskType: string) => {
  switch(taskType) {
    case 'simple_chat':
      return 'gemini-flash'; // FREE or $0.075/1M
    case 'analysis':
      return 'deepseek-v3'; // $0.27/1M
    case 'complex_reasoning':
      return 'claude-sonnet'; // $3.00/1M
    case 'code_generation':
      return 'grok-beta'; // $5.00/1M
    default:
      return 'gemini-flash';
  }
};
```

### **Strategy 2: Quality-Based Routing**

```typescript
// Route by quality needs
const getProviderForQuality = (qualityNeeded: string) => {
  switch(qualityNeeded) {
    case 'highest':
      return 'claude-opus'; // Best quality
    case 'high':
      return 'claude-sonnet'; // Excellent quality
    case 'medium':
      return 'gpt-4o'; // Good quality
    case 'low':
      return 'gemini-flash'; // Fast & cheap
    default:
      return 'deepseek-v3'; // Best value
  }
};
```

### **Strategy 3: Load Balancing**

```typescript
// Distribute load across providers
const providers = [
  'gemini-flash',
  'deepseek-v3',
  'claude-haiku',
  'gpt-4o-mini'
];

let currentIndex = 0;
const getNextProvider = () => {
  const provider = providers[currentIndex];
  currentIndex = (currentIndex + 1) % providers.length;
  return provider;
};
```

---

## 📊 Feature Comparison

| Feature | Gemini | Claude | OpenAI | Grok | DeepSeek | OpenRouter |
|---------|--------|--------|--------|------|----------|------------|
| **Free Tier** | ✅ Best | ❌ | ⚠️ $5 trial | ❌ | ✅ Via OR | ✅ |
| **Context Length** | 2M tokens | 200K | 128K | 128K | 64K | Varies |
| **Vision** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ | ⚡⚡ | ⚡⚡⚡ | Varies |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Varies |
| **Cost** | Low | High | Medium | High | Very Low | Low |
| **Best For** | General | Reasoning | Popular | Latest | Coding | Variety |

---

## 🎯 Final Recommendations

### **For Development/Testing**:
```bash
VITE_GEMINI_API_KEY=your_free_key
```
**Cost**: $0/month

### **For Production (Low Budget)**:
```bash
VITE_OPENROUTER_API_KEY=your_key
```
**Cost**: $10-50/month

### **For Production (Medium Budget)**:
```bash
VITE_GEMINI_API_KEY=your_key
VITE_OPENROUTER_API_KEY=your_key
```
**Cost**: $100-500/month

### **For Production (Premium)**:
```bash
VITE_CLAUDE_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
VITE_OPENROUTER_API_KEY=your_key
```
**Cost**: $500-5,000+/month

---

## 📞 Provider Support

| Provider | Documentation | Support |
|----------|--------------|---------|
| **OpenRouter** | https://openrouter.ai/docs | Discord community |
| **Gemini** | https://ai.google.dev/docs | Forum + email |
| **Claude** | https://docs.anthropic.com/ | Email support |
| **OpenAI** | https://platform.openai.com/docs | Help center |
| **Grok** | https://docs.x.ai/ | X Premium support |
| **DeepSeek** | https://platform.deepseek.com/docs | Email support |

---

**Next**: See `IMPLEMENTATION.md` for code examples of how to use all these providers in StockBrain.
