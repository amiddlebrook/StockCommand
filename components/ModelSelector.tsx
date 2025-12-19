import React from 'react';
import { Icon } from './Icon';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'GOOGLE' | 'ANTHROPIC' | 'OPENAI' | 'OPENROUTER';
  costPer1k: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'olmo-think', name: 'OLMo 3.1 Think (32B)', provider: 'OPENROUTER', costPer1k: 0 },
  { id: 'nemotron-nano', name: 'Nemotron 3 Nano', provider: 'OPENROUTER', costPer1k: 0 },
  { id: 'deepseek-nex', name: 'DeepSeek V3.1 Nex', provider: 'OPENROUTER', costPer1k: 0 },
  { id: 'katcoder-pro', name: 'KAT-Coder Pro', provider: 'OPENROUTER', costPer1k: 0 },
  { id: 'gpt-oss', name: 'GPT-OSS (120B)', provider: 'OPENROUTER', costPer1k: 0 },
];

interface ModelSelectorProps {
  taskName: string;
  description: string;
  customIcon?: string;
  selectedModelId: string;
  isLocked?: boolean;
  onSelect: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  taskName,
  description,
  customIcon = 'cpu',
  selectedModelId,
  isLocked = false,
  onSelect
}) => {
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <div className={`
            p-6 bg-slate-900/40 border rounded-xl transition-all duration-200 relative overflow-hidden group
            ${isLocked ? 'border-slate-800 opacity-70' : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60'}
        `}>
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-amber-500/30 text-amber-500 shadow-lg">
            <Icon icon="lock" className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider">PRO FEATURE</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon Box */}
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
          <Icon icon={customIcon as any} className="w-6 h-6 text-cyan-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-200">{taskName}</h3>
            {isLocked && <Icon icon="lock" className="w-3 h-3 text-slate-600" />}
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Selector */}
          <div className="relative">
            <select
              value={selectedModelId}
              onChange={(e) => onSelect(e.target.value)}
              disabled={isLocked}
              className={`
                                w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 outline-none
                                ${!isLocked && 'hover:border-cyan-500/50 cursor-pointer'} 
                            `}
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} (${model.costPer1k}/1k)
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon icon="chevron-down" className="w-3 h-3 text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
