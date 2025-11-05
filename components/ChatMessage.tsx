import React from 'react';
import { ChatMessage as ChatMessageType, Source } from '../types';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessageType;
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


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, isLoading, sources } = message;
  const isUser = role === 'user';

  const contentWithLineBreaks = content.replace(/\n/g, '<br />');

  return (
    <div className={`flex items-start gap-3 animate-fadeIn ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
            <Icon icon="bot" className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className={`max-w-2xl flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 inline-block text-sm rounded-2xl shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 text-white rounded-tr-sm'
            : 'bg-slate-800/50 backdrop-blur-sm text-gray-100 border border-slate-700/50 rounded-tl-sm'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <LoadingSpinner className="w-4 h-4" />
              <span className="text-cyan-400 animate-pulse">Analyzing...</span>
            </div>
          ) : (
             <div dangerouslySetInnerHTML={{ __html: contentWithLineBreaks }} className="leading-relaxed" />
          )}
        </div>

        {!isUser && !isLoading && sources && sources.length > 0 && (
          <div className="mt-3 pl-1">
            <h4 className="text-xs font-semibold mb-2 text-gray-500 tracking-wider uppercase">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <SourceLink key={index} source={source} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
          U
        </div>
      )}
    </div>
  );
};