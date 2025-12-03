#!/bin/bash

# Cloudflare Secrets Setup Script for StockBrain
# This script configures all required secrets for the StockBrain app

echo "🚀 Setting up Cloudflare secrets for StockBrain..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"

# Function to set a secret if value is provided
set_secret() {
    local secret_name=$1
    local prompt_message=$2
    
    echo ""
    read -p "$prompt_message: " secret_value
    
    if [ -n "$secret_value" ]; then
        echo "🔑 Setting $secret_name..."
        echo "$secret_value" | wrangler secret put "$secret_name"
        echo "✅ $secret_name configured"
    else
        echo "⏭️  Skipping $secret_name (no value provided)"
    fi
}

echo ""
echo "📋 Configure at least one AI provider API key:"
echo "   Gemini (recommended), OpenAI, Claude, or OpenRouter models"
echo ""

# AI Provider Secrets
set_secret "GEMINI_API_KEY" "Enter Gemini API Key (or press Enter to skip)"
set_secret "OPENAI_API_KEY" "Enter OpenAI API Key (or press Enter to skip)"
set_secret "CLAUDE_API_KEY" "Enter Claude API Key (or press Enter to skip)"

echo ""
echo "🤖 OpenRouter API Keys (free models available):"
set_secret "OPENROUTER_QWEN3_CODER_API_KEY" "Enter OpenRouter Qwen3 Coder API Key (or press Enter to skip)"
set_secret "OPENROUTER_DEEPSEEK_R1T2_API_KEY" "Enter OpenRouter DeepSeek R1T2 API Key (or press Enter to skip)"
set_secret "OPENROUTER_DEEPSEEK_CHAT_API_KEY" "Enter OpenRouter DeepSeek Chat API Key (or press Enter to skip)"
set_secret "OPENROUTER_MINIMAX_M2_API_KEY" "Enter OpenRouter Minimax M2 API Key (or press Enter to skip)"
set_secret "OPENROUTER_GLM_45_AIR_API_KEY" "Enter OpenRouter GLM 4.5 Air API Key (or press Enter to skip)"
set_secret "OPENROUTER_QWEN3_235B_API_KEY" "Enter OpenRouter Qwen3 235B API Key (or press Enter to skip)"

echo ""
echo "🎯 Optional APIs:"
set_secret "ODDS_API_KEY" "Enter Odds API Key for sports betting (or press Enter to skip)"

echo ""
echo "🎉 Cloudflare secrets setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Build the app: npm run build"
echo "2. Deploy to Cloudflare: wrangler deploy"
echo "3. Test at: https://stockbrain.averymiddlebrook2014.workers.dev"
echo ""
echo "💡 Remember to push your changes to GitHub for automatic deployment:"
echo "   git add ."
echo "   git commit -m 'Configure Cloudflare secrets'"
echo "   git push"
