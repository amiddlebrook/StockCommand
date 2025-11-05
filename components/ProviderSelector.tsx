import React, { useEffect, useState } from 'react';
import { getAvailableProviders } from '../services/geminiService';
import { Icon } from './Icon';

interface ProviderSelectorProps {
  selectedProvider: string | null;
  onProviderChange: (provider: string | null) => void;
}

const PROVIDER_NAMES: Record<string, string> = {
  'gemini': 'Gemini 2.0',
  'openai': 'GPT-4o Mini',
  'claude': 'Claude 3.5',
  'openrouter-qwen3-coder': 'Qwen 3 Coder',
  'openrouter-deepseek-r1t2': 'DeepSeek R1',
  'openrouter-deepseek-chat': 'DeepSeek Chat',
  'openrouter-minimax-m2': 'Minimax M2',
  'openrouter-glm-45-air': 'GLM 4.5',
  'openrouter-qwen3-235b': 'Qwen 3 235B',
  'cloudflare': 'Llama 3 (Free)',
};

const PROVIDER_ICONS: Record<string, string> = {
  'gemini': '🔷',
  'openai': '🤖',
  'claude': '🧠',
  'openrouter-qwen3-coder': '💻',
  'openrouter-deepseek-r1t2': '🔬',
  'openrouter-deepseek-chat': '💬',
  'openrouter-minimax-m2': '⚡',
  'openrouter-glm-45-air': '🌟',
  'openrouter-qwen3-235b': '🚀',
  'cloudflare': '☁️',
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ selectedProvider, onProviderChange }) => {
  const [providers, setProviders] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      const available = await getAvailableProviders();
      setProviders(['cloudflare', ...available]); // Always include cloudflare as fallback
      setIsLoading(false);
    };
    loadProviders();
  }, []);

  const currentProvider = selectedProvider || (providers[1] || 'cloudflare');
  const displayName = PROVIDER_NAMES[currentProvider] || currentProvider;
  const icon = PROVIDER_ICONS[currentProvider] || '🤖';

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500">
        Loading providers...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wider">AI Model</span>
            <span className="text-sm text-gray-200 font-medium">{displayName}</span>
          </div>
        </div>
        <Icon
          icon={isOpen ? "chevron_up" : "chevron_down"}
          className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {providers.length === 1 ? (
            <div className="p-3 text-xs text-gray-500 text-center">
              No API keys configured. Using free Cloudflare AI.
            </div>
          ) : (
            providers.map((provider) => {
              const name = PROVIDER_NAMES[provider] || provider;
              const providerIcon = PROVIDER_ICONS[provider] || '🤖';
              const isSelected = provider === currentProvider;
              const isFree = provider === 'cloudflare';

              return (
                <button
                  key={provider}
                  onClick={() => {
                    onProviderChange(provider === 'cloudflare' ? null : provider);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-cyan-600/20 text-cyan-400'
                      : 'hover:bg-slate-800/50 text-gray-300'
                  }`}
                >
                  <span className="text-lg">{providerIcon}</span>
                  <span className="text-sm flex-1">{name}</span>
                  {isFree && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                      Free
                    </span>
                  )}
                  {isSelected && (
                    <Icon icon="check" className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
