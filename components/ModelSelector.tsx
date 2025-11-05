import React from 'react';
import { DEFAULT_CHAT_MODEL, type LlmModelOption } from '../lib/constants/llmModels';

interface ModelSelectorProps {
  selectedModel?: string;
  onChange: (modelId: string) => void;
  availableModels?: LlmModelOption[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel = DEFAULT_CHAT_MODEL.id,
  onChange,
  availableModels = [],
}) => {
  // Show available models, or fall back to just the default model
  const modelsToShow = availableModels.length > 0 ? availableModels : [DEFAULT_CHAT_MODEL];

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
        Model
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {modelsToShow.map(option => {
          const isActive = option.id === selectedModel;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`group relative min-w-[100px] flex-shrink-0 rounded-lg border px-2.5 py-1.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${
                isActive
                  ? 'border-cyan-500/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
              }`}
              aria-pressed={isActive}
              title={`${option.name} (${option.provider})`}
            >
              <span
                className={`block text-xs font-semibold truncate ${
                  isActive ? 'text-cyan-200' : 'text-gray-200'
                }`}
              >
                {option.name}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-slate-500">
                <span className="inline-flex h-1 w-1 rounded-full bg-cyan-500/80" />
                <span className="truncate">{option.provider}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
