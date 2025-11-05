import React from 'react';
import { LLM_MODEL_OPTIONS, type LlmModelOption } from '../lib/constants/llmModels';

interface ModelSelectorProps {
  selectedModel?: string;
  onChange: (modelId: string) => void;
  availableModels?: LlmModelOption[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
  availableModels = [],
}) => {
  // Create a set of available provider IDs for quick lookup
  const availableProviders = new Set(availableModels.map(m => m.provider));

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
        Model
      </span>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {LLM_MODEL_OPTIONS.map(option => {
          const isActive = option.id === selectedModel;
          const isAvailable = availableProviders.has(option.provider);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              disabled={!isAvailable}
              className={`group relative min-w-[110px] flex-shrink-0 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                !isAvailable
                  ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/20'
                  : isActive
                  ? 'border-cyan-500/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
              }`}
              aria-pressed={isActive}
              title={`${option.name} (${option.provider})${!isAvailable ? ' - Not configured' : ''}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`block text-[11px] font-semibold truncate flex-1 ${
                    !isAvailable
                      ? 'text-gray-600'
                      : isActive
                      ? 'text-cyan-200'
                      : 'text-gray-200'
                  }`}
                >
                  {option.name}
                </span>
                {isAvailable && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 mt-0.5 flex-shrink-0" title="API configured" />
                )}
              </div>
              <span className={`mt-1 flex items-center gap-1 text-[8px] uppercase tracking-wide ${
                !isAvailable ? 'text-slate-600' : 'text-slate-500'
              }`}>
                <span className="truncate">{option.provider}</span>
              </span>
            </button>
          );
        })}
      </div>
      {availableProviders.size === 0 && (
        <p className="text-[10px] text-yellow-500 mt-1">
          ⚠️ No API keys configured. Add secrets in Cloudflare.
        </p>
      )}
    </div>
  );
};
