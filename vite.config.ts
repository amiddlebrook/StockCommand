import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Legacy support
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // AI Provider API Keys
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.VITE_CLAUDE_API_KEY': JSON.stringify(env.CLAUDE_API_KEY),
        // OpenRouter API Keys
        'process.env.VITE_OPENROUTER_QWEN3_CODER_API_KEY': JSON.stringify(env.OPENROUTER_QWEN3_CODER_API_KEY),
        'process.env.VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY': JSON.stringify(env.OPENROUTER_DEEPSEEK_R1T2_API_KEY),
        'process.env.VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY': JSON.stringify(env.OPENROUTER_DEEPSEEK_CHAT_API_KEY),
        'process.env.VITE_OPENROUTER_MINIMAX_M2_API_KEY': JSON.stringify(env.OPENROUTER_MINIMAX_M2_API_KEY),
        'process.env.VITE_OPENROUTER_GLM_45_AIR_API_KEY': JSON.stringify(env.OPENROUTER_GLM_45_AIR_API_KEY),
        'process.env.VITE_OPENROUTER_QWEN3_235B_API_KEY': JSON.stringify(env.OPENROUTER_QWEN3_235B_API_KEY),
        // Odds API
        'process.env.VITE_ODDS_API_KEY': JSON.stringify(env.ODDS_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name][extname]'
          }
        }
      }
    };
});
