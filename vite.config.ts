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
      // OpenRouter API Keys (5 Free Models)
      'process.env.OPENROUTER_OLMO_THINK_API_KEY': JSON.stringify(env.OPENROUTER_OLMO_THINK_API_KEY),
      'process.env.OPENROUTER_NEMOTRON_NANO_API_KEY': JSON.stringify(env.OPENROUTER_NEMOTRON_NANO_API_KEY),
      'process.env.OPENROUTER_DEEPSEEK_NEX_API_KEY': JSON.stringify(env.OPENROUTER_DEEPSEEK_NEX_API_KEY),
      'process.env.OPENROUTER_KATCODER_PRO_API_KEY': JSON.stringify(env.OPENROUTER_KATCODER_PRO_API_KEY),
      'process.env.OPENROUTER_GPT_OSS_API_KEY': JSON.stringify(env.OPENROUTER_GPT_OSS_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },

  };
});
