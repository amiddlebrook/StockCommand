import React from 'react';
import { Source } from '../types';
import { Icon } from './Icon';

interface TextWidgetProps {
  id: string;
  title: string;
  text: string;
  sources?: Source[];
  onRemove: (id: string) => void;
}

const SourceLink: React.FC<{ source: Source, index: number }> = ({ source, index }) => (
    <a
        href={source.web.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-2 border border-slate-700/50 hover:border-cyan-500/30 shadow-sm"
    >
        <span className="text-cyan-500 font-bold">#{index + 1}</span>
        <span className="truncate max-w-[200px]">{source.web.title}</span>
    </a>
);

export const TextWidget: React.FC<TextWidgetProps> = ({ id, title, text, sources, onRemove }) => {
  const contentWithLineBreaks = text
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-100">$1</strong>');

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
        <header className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-b border-slate-700/30">
            <h3 className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                {title}
            </h3>
            <button
                onClick={() => onRemove(id)}
                className="text-gray-500 hover:text-red-400 transition-colors rounded-lg p-1.5 hover:bg-slate-700/50"
                aria-label="Remove widget"
            >
                <Icon icon="close" className="w-4 h-4" />
            </button>
        </header>
        <div className="p-5">
            <div
                className="text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contentWithLineBreaks }}
            />
            {sources && sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-700/30">
                    <h4 className="text-xs font-semibold mb-3 text-gray-500 tracking-wider uppercase">Sources</h4>
                    <div className="flex flex-wrap gap-2">
                        {sources.map((source, index) => (
                            <SourceLink key={index} source={source} index={index} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
