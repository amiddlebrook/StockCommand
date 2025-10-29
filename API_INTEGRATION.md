# API Integration Guide

This document provides detailed information about the multi-provider API integration in StockBrain.

## Overview

StockBrain now supports multiple AI providers, allowing you to choose from:
- Google Gemini
- OpenAI
- Anthropic Claude
- Various OpenRouter models (free tiers available)

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add at least one API key to `.env.local`:
   ```bash
   # Example: Using Gemini
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Supported Providers

### Google Gemini (Recommended)
- **Environment Variable**: `VITE_GEMINI_API_KEY`
- **Get API Key**: https://ai.google.dev/
- **Features**: Full support for all StockBrain features
- **Cost**: Free tier available

### OpenAI
- **Environment Variable**: `VITE_OPENAI_API_KEY`
- **Get API Key**: https://platform.openai.com/api-keys
- **Features**: Configuration ready (native client support coming soon)
- **Cost**: Pay per use

### Anthropic Claude
- **Environment Variable**: `VITE_CLAUDE_API_KEY`
- **Get API Key**: https://console.anthropic.com/
- **Features**: Configuration ready (native client support coming soon)
- **Cost**: Pay per use

### OpenRouter Models

OpenRouter provides access to many AI models, including free tiers:

#### Qwen 3 Coder (Free)
- **Environment Variable**: `VITE_OPENROUTER_QWEN3_CODER_API_KEY`
- **Model**: `qwen/qwen3-coder:free`

#### DeepSeek Chat v3.1 (Free)
- **Environment Variable**: `VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY`
- **Model**: `deepseek/deepseek-chat-v3.1:free`

#### DeepSeek R1-T2 Chimera (Free)
- **Environment Variable**: `VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY`
- **Model**: `tngtech/deepseek-r1t2-chimera:free`

#### Minimax M2 (Free)
- **Environment Variable**: `VITE_OPENROUTER_MINIMAX_M2_API_KEY`
- **Model**: `minimax/minimax-m2:free`

#### GLM 4.5 Air (Free)
- **Environment Variable**: `VITE_OPENROUTER_GLM_45_AIR_API_KEY`
- **Model**: `z-ai/glm-4.5-air:free`

#### Qwen 3 235B (Free)
- **Environment Variable**: `VITE_OPENROUTER_QWEN3_235B_API_KEY`
- **Model**: `qwen/qwen3-235b-a22b:free`

**Get OpenRouter API Keys**: https://openrouter.ai/

## Optional APIs

### Odds API
For sports betting odds data:
- **Environment Variable**: `VITE_ODDS_API_KEY`
- **Get API Key**: https://the-odds-api.com/

## Provider Priority

The app automatically selects the first available provider in this order:
1. Gemini
2. OpenAI
3. Claude
4. OpenRouter: DeepSeek Chat
5. OpenRouter: Qwen 3 235B
6. OpenRouter: Qwen 3 Coder
7. OpenRouter: DeepSeek R1-T2
8. OpenRouter: Minimax M2
9. OpenRouter: GLM 4.5 Air

## Current Limitations

- **Native Client Support**: While multiple providers can be configured, the app currently uses the Gemini client for all operations. Full native support for OpenAI, Claude, and OpenRouter clients is planned for future releases.
- **Fallback Behavior**: If a non-Gemini provider is configured but Gemini is available, the app will use Gemini for full functionality.

## Security Best Practices

1. **Never commit** your `.env.local` file to version control
2. **Keep your API keys secret** - don't share them publicly
3. **Rotate keys regularly** if you suspect they've been compromised
4. **Use environment-specific keys** for development vs production
5. **Monitor your API usage** to detect unauthorized access

## Troubleshooting

### "No AI provider API key found" error
- Ensure you've created a `.env.local` file
- Verify at least one API key is set
- Check that the environment variable names match exactly (including `VITE_` prefix)
- Restart the dev server after adding new keys

### "API key is not configured" error
- Verify your API key is valid
- Check for extra spaces or newlines in the `.env.local` file
- Ensure the key has proper permissions on the provider's platform

### Provider not being used
- Check the provider priority order
- Verify the API key is valid and active
- Check browser console for initialization messages

## Future Enhancements

- Native client support for OpenAI, Claude, and OpenRouter
- Provider switching UI
- Custom provider priority configuration
- Multi-provider fallback chains
- Provider-specific feature optimization

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API keys are valid
3. Ensure you're using the latest version of StockBrain
4. Open an issue on GitHub with details about your setup
