#!/usr/bin/env node
/**
 * API Configuration Checker
 * Verifies that API keys are properly configured for StockCommand
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const providers = {
  'Gemini': ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY'],
  'OpenAI': ['VITE_OPENAI_API_KEY', 'OPENAI_API_KEY'],
  'Claude': ['VITE_CLAUDE_API_KEY', 'CLAUDE_API_KEY'],
  'OpenRouter Qwen3 Coder': ['VITE_OPENROUTER_QWEN3_CODER_API_KEY'],
  'OpenRouter DeepSeek R1-T2': ['VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY'],
  'OpenRouter DeepSeek Chat': ['VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY'],
  'OpenRouter Minimax M2': ['VITE_OPENROUTER_MINIMAX_M2_API_KEY'],
  'OpenRouter GLM 4.5 Air': ['VITE_OPENROUTER_GLM_45_AIR_API_KEY'],
  'OpenRouter Qwen3 235B': ['VITE_OPENROUTER_QWEN3_235B_API_KEY'],
  'Odds API': ['VITE_ODDS_API_KEY', 'ODDS_API_KEY'],
};

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, 'utf-8');
  const vars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      vars[key.trim()] = value.trim();
    }
  });

  return vars;
}

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.substring(0, 4) + '***' + key.substring(key.length - 4);
}

console.log('🔍 StockCommand API Configuration Checker\n');

const envLocalPath = join(__dirname, '.env.local');
const envPath = join(__dirname, '.env');

let envVars = {};

if (existsSync(envLocalPath)) {
  console.log('✓ Found .env.local file');
  envVars = { ...envVars, ...loadEnvFile(envLocalPath) };
} else {
  console.log('⚠ No .env.local file found');
}

if (existsSync(envPath)) {
  console.log('✓ Found .env file');
  envVars = { ...envVars, ...loadEnvFile(envPath) };
}

console.log('\n📋 Provider Configuration Status:\n');

let configuredCount = 0;
const configuredProviders = [];

Object.entries(providers).forEach(([providerName, envKeys]) => {
  const foundKey = envKeys.find(key => envVars[key] && envVars[key].length > 0);
  
  if (foundKey) {
    console.log(`✅ ${providerName.padEnd(30)} ${maskKey(envVars[foundKey])}`);
    configuredCount++;
    configuredProviders.push(providerName);
  } else {
    console.log(`❌ ${providerName.padEnd(30)} Not configured`);
  }
});

console.log('\n' + '='.repeat(60));

if (configuredCount === 0) {
  console.log('\n⚠️  WARNING: No API providers configured!');
  console.log('\nTo get started:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Add at least one API key to .env.local');
  console.log('3. Run this script again to verify\n');
  process.exit(1);
} else {
  console.log(`\n✅ Success! ${configuredCount} provider(s) configured:`);
  configuredProviders.forEach(provider => {
    console.log(`   • ${provider}`);
  });
  
  if (!configuredProviders.some(p => p === 'Gemini')) {
    console.log('\n💡 Tip: For full functionality, configure Gemini API');
  }
  
  console.log('\n🚀 You\'re ready to run: npm run dev\n');
  process.exit(0);
}
