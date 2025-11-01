# Cloudflare Workers Deployment Guide

This guide explains how Cloudflare Workers works with StockBrain and how to deploy your app.

## 🎯 What Just Got Fixed

**The Build Error**: `@cloudflare/ai` package couldn't be resolved

**The Solution**:
- Removed deprecated `@cloudflare/ai` import
- Updated to use **native Cloudflare AI binding** directly
- Added Cloudflare Workers types for TypeScript support

**Why This is Better**:
- ✅ Faster builds (no extra dependencies)
- ✅ Modern Cloudflare approach
- ✅ FREE AI models included
- ✅ No external API keys needed for AI*

*You can still use external providers like Gemini, OpenAI, Claude if you want

---

## ☁️ Understanding Cloudflare Workers

### What is Cloudflare Workers?

**Cloudflare Workers** is a serverless platform that runs your code on Cloudflare's global network (200+ cities worldwide).

**Benefits**:
- ⚡ **Ultra-fast**: Runs at the edge, close to users
- 💰 **FREE tier**: 100,000 requests/day
- 🌍 **Global**: Automatic worldwide deployment
- 🔒 **Secure**: Built-in DDoS protection
- 🤖 **AI included**: FREE AI models (Workers AI)

### How Your App Uses It

```
User Request → Cloudflare Edge → Your Worker
                                   ├── Serves React App (static assets)
                                   ├── Handles /api/* requests
                                   └── Calls AI models (FREE)
```

---

## 🔧 Cloudflare Bindings (What You Have)

**Bindings** connect your Worker to Cloudflare services. You currently have:

### 1. **AI Binding** (FREE AI Models)

**Config** (`wrangler.toml`):
```toml
[ai]
binding = "AI"
```

**What it does**: Gives you access to FREE AI models

**How your code uses it**:
```typescript
// In api/index.ts
const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  prompt: "Your question here"
});
```

**Available FREE Models**:
- `@cf/meta/llama-3-8b-instruct` - Text generation & chat (8B parameters)
- `@cf/meta/llama-3-1-8b-instruct` - Latest Llama 3.1
- `@cf/unum/uform-gen2-qwen-500m` - Image analysis
- Many more: https://developers.cloudflare.com/workers-ai/models/

**Pricing**:
- FREE tier: 10,000 neurons/day
- Paid: $0.01 per 1,000 neurons
- Very cheap compared to OpenAI/Claude

### 2. **Assets Binding** (Serves Your React App)

**Config** (`wrangler.toml`):
```toml
[assets]
directory = "./dist"
binding = "ASSETS"
```

**What it does**: Serves your built React app from the `dist` folder

**How your code uses it**:
```typescript
// In api/index.ts
return env.ASSETS.fetch(request);
```

---

## 🔑 Secrets & Environment Variables

### What's the Difference?

| Type | Use For | How to Set | Visible in Code |
|------|---------|------------|----------------|
| **Secrets** | API keys, passwords | Wrangler CLI or Dashboard | Yes (encrypted in transit) |
| **Environment Variables** | Public config | `wrangler.toml` | Yes (plaintext) |
| **Bindings** | Cloudflare services | `wrangler.toml` | Yes (service reference) |

### Your Current Env Type

```typescript
// In api/index.ts
type Env = {
  ASSETS: AssetFetcher;      // Binding (serves React app)
  AI: any;                   // Binding (AI models)
  GEMINI_API_KEY?: string;   // Secret (optional - for external Gemini)
  OPENAI_API_KEY?: string;   // Secret (optional - for external OpenAI)
  CLAUDE_API_KEY?: string;   // Secret (optional - for external Claude)
};
```

### How to Add Secrets

#### **Method 1: Wrangler CLI** (Recommended)

```bash
# Set a secret via command line
wrangler secret put GEMINI_API_KEY
# It will prompt you to enter the value

# Or pipe it in
echo "your-api-key-here" | wrangler secret put GEMINI_API_KEY
```

#### **Method 2: Cloudflare Dashboard**

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages**
3. Select your worker (`stockbrain`)
4. Click **Settings** → **Variables**
5. Click **Add variable** → Select **Encrypt** for secrets
6. Add your secrets:
   - Name: `GEMINI_API_KEY`
   - Value: `your-api-key-here`
   - Type: **Secret** (encrypted)

#### **Method 3: GitHub Actions** (For CI/CD)

Already configured in `.github/workflows/deploy.yml`:

```yaml
- name: Deploy to Cloudflare Workers
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

To add more secrets:
1. Go to GitHub → Your Repo → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Add secrets like `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.

---

## 🚀 Deployment Options

### **Option 1: Deploy via GitHub Actions** (Automatic)

Already set up! Just push to the main branch:

```bash
git push origin main
```

GitHub Actions will:
1. Build your React app
2. Deploy to Cloudflare Workers
3. Your app goes live automatically

**Prerequisites**:
- Set GitHub secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

### **Option 2: Deploy via Wrangler CLI** (Manual)

```bash
# Login to Cloudflare
wrangler login

# Build the frontend
npm run build

# Deploy the worker
wrangler deploy
```

Your app will be live at: `https://stockbrain.<your-subdomain>.workers.dev`

### **Option 3: Deploy with Custom Domain**

1. Deploy with wrangler: `wrangler deploy`
2. Go to Cloudflare Dashboard → Workers & Pages → stockbrain
3. Click **Custom Domains** → **Add Custom Domain**
4. Enter your domain (must be on Cloudflare DNS)
5. Click **Add Domain**

Your app will be live at: `https://yourdomain.com`

---

## 🔐 Getting Cloudflare API Credentials

### **1. Cloudflare API Token** (For GitHub Actions)

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. **Permissions**:
   - Account → Workers Scripts → Edit
   - Account → Account Settings → Read
5. Click **Continue to summary** → **Create Token**
6. **Copy the token** (you won't see it again!)
7. Add to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### **2. Cloudflare Account ID**

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** in the sidebar
3. Copy your **Account ID** from the right side
4. Add to GitHub Secrets as `CLOUDFLARE_ACCOUNT_ID`

---

## 📊 More Cloudflare Bindings You Can Add

### **KV (Key-Value Storage)** - Store user preferences

```toml
# Add to wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your_kv_namespace_id"
```

**Use case**: Cache stock data, store user watchlists

**Pricing**: FREE tier: 100,000 reads/day, 1,000 writes/day

### **D1 (SQL Database)** - Store user data

```toml
# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "stockbrain-db"
database_id = "your_database_id"
```

**Use case**: User accounts, historical stock data

**Pricing**: FREE tier: 5 GB storage, 5M reads/day

### **R2 (Object Storage)** - Store files

```toml
# Add to wrangler.toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "stockbrain-files"
```

**Use case**: Store user uploads, backups

**Pricing**: FREE tier: 10 GB storage, 1M Class A ops/month

### **Queues** - Background jobs

```toml
# Add to wrangler.toml
[[queues.producers]]
binding = "QUEUE"
queue = "stockbrain-jobs"
```

**Use case**: Process stock data updates, send notifications

**Pricing**: FREE tier: 1M operations/month

### **Durable Objects** - Stateful coordination

```toml
# Add to wrangler.toml
[[durable_objects.bindings]]
name = "ROOM"
class_name = "StockRoom"
script_name = "stockbrain"
```

**Use case**: Real-time stock updates, collaborative features

**Pricing**: $0.15 per million requests

---

## 🧪 Testing Your Worker Locally

### **Run Worker Locally**

```bash
# Start local dev server with Worker
npm run dev

# Or use wrangler dev directly
wrangler dev
```

This runs your Worker locally with:
- Hot reloading
- Local AI models (simulated)
- Local bindings

### **Test Worker in Production Mode**

```bash
# Deploy to a preview environment
wrangler deploy --env preview

# Or test with dry-run
wrangler deploy --dry-run
```

---

## 📈 Monitoring & Debugging

### **View Logs** (Real-time)

```bash
# Tail logs from your deployed worker
wrangler tail
```

### **Cloudflare Dashboard Analytics**

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** → **stockbrain**
3. View:
   - Request count
   - Errors
   - CPU time
   - Execution duration

### **Worker Analytics API**

```bash
# Get worker analytics
wrangler analytics
```

---

## 💰 Cloudflare Pricing

### **Workers Free Tier**

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Requests** | 100,000/day | $0.50 per million |
| **CPU Time** | 10ms per request | 50ms per request |
| **Workers AI** | 10,000 neurons/day | $0.01 per 1,000 neurons |
| **KV Reads** | 100,000/day | $0.50 per million |
| **KV Writes** | 1,000/day | $5.00 per million |
| **D1 Storage** | 5 GB | $0.75 per GB/month |
| **R2 Storage** | 10 GB | $0.015 per GB/month |

**StockBrain Estimated Costs**:
- **Development**: $0/month (free tier sufficient)
- **Low Traffic** (<100k requests/day): $0/month
- **Medium Traffic** (1M requests/month): ~$5-10/month
- **High Traffic** (10M requests/month): ~$50-100/month

Still **MUCH cheaper** than AWS Lambda or Google Cloud Run!

---

## 🔧 Troubleshooting

### **Build Error: "Could not resolve..."**

**Solution**: Already fixed! We removed the deprecated `@cloudflare/ai` import.

### **403 Error on Production Site**

**Possible causes**:
1. Worker not deployed correctly
2. Routes not configured
3. API keys missing in production

**Solution**:
```bash
# Check worker status
wrangler deployments list

# Check routes
wrangler routes list

# Redeploy
wrangler deploy
```

### **"AI binding not found"**

**Solution**: Make sure `wrangler.toml` has:
```toml
[ai]
binding = "AI"
```

### **Secrets Not Working**

**Solution**:
```bash
# List current secrets
wrangler secret list

# Delete old secret
wrangler secret delete OLD_KEY

# Add new secret
wrangler secret put NEW_KEY
```

---

## 🎯 Next Steps

### **Immediate (Get Production Working)**

1. **Fix the 403 error**:
   ```bash
   wrangler login
   npm run build
   wrangler deploy
   ```

2. **Add secrets** (optional - only if you want external AI providers):
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```

3. **Test the live site**: Visit your `.workers.dev` URL

### **Short Term (Enhance)**

1. **Add KV storage** for caching stock data
2. **Add D1 database** for user accounts
3. **Set up custom domain**
4. **Add monitoring** with wrangler tail

### **Long Term (Scale)**

1. **Use Durable Objects** for real-time features
2. **Add R2** for file storage
3. **Implement rate limiting**
4. **Add user authentication**

---

## 📚 Useful Resources

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Workers AI Models**: https://developers.cloudflare.com/workers-ai/models/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Workers Examples**: https://developers.cloudflare.com/workers/examples/
- **Pricing Calculator**: https://workers.cloudflare.com/pricing

---

## 🎉 Summary

**What You Have Now**:
- ✅ Working Cloudflare Worker build
- ✅ FREE AI models (Workers AI)
- ✅ Static asset serving (React app)
- ✅ Auto-deployment via GitHub Actions
- ✅ TypeScript types for Workers

**What You DON'T Need**:
- ❌ External AI API keys (unless you want to use them)
- ❌ Database setup (yet - use KV/D1 when ready)
- ❌ Complex server infrastructure

**What's FREE**:
- ✅ 100,000 requests/day
- ✅ 10,000 AI neurons/day (enough for testing)
- ✅ Global CDN
- ✅ DDoS protection
- ✅ SSL certificates

**Ready to deploy!** 🚀
