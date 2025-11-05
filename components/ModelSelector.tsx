import React from 'react';
import { DEFAULT_CHAT_MODEL, type LlmModelOption } from '../lib/constants/llmModels';

interface ModelSelectorProps {
  selectedModel?: string;
  modelOptions?: LlmModelOption[];
  onChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel = DEFAULT_CHAT_MODEL.id,
  modelOptions = [],
  onChange,
}) => {
  // If no models are loaded yet, show a loading state
  if (modelOptions.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
          Model
        </span>
        <div className="px-3 py-2 text-xs text-slate-500">
          Loading models...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
        Model
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {modelOptions.map(option => {
          const isActive = option.id === selectedModel;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`group relative min-w-[160px] whitespace-nowrap rounded-lg border px-4 py-2.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                isActive
                  ? 'border-cyan-500/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
              }`}
              aria-pressed={isActive}
            >
              <span
                className={`block text-xs font-semibold truncate ${
                  isActive ? 'text-cyan-200' : 'text-gray-200'
                }`}
              >
                {option.name}
              </span>
              <span className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500/80" />
                <span className="truncate">{option.provider}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
