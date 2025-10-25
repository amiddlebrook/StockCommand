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
        className="text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3 py-1 transition-colors inline-block border border-gray-700"
    >
        {index + 1}. {source.web.title}
    </a>
);

export const TextWidget: React.FC<TextWidgetProps> = ({ id, title, text, sources, onRemove }) => {
  const contentWithLineBreaks = text
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-100">$1</strong>');

  return (
    <div className="bg-black border border-gray-800">
        <header className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">{title}</h3>
            <button onClick={() => onRemove(id)} className="text-gray-500 hover:text-white">
                <Icon icon="close" className="w-4 h-4" />
            </button>
        </header>
        <div className="p-4">
            <div 
                className="text-gray-400 prose prose-invert prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: contentWithLineBreaks }} 
            />
            {sources && sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="text-xs font-semibold mb-2 text-gray-400 tracking-wider uppercase">Sources:</h4>
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