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
    className="text-[10px] bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded transition-all inline-flex items-center gap-1.5 border border-slate-700/50 hover:border-cyan-500/30"
  >
    <span className="text-cyan-500 font-bold">#{index + 1}</span>
    <span className="truncate max-w-[150px]">{source.web.title}</span>
  </a>
);

const MicroWidget: React.FC<{ type: string, value: number }> = ({ type, value }) => {
  if (type === 'RSI') {
    const color = value > 70 ? 'bg-red-500' : value < 30 ? 'bg-emerald-500' : 'bg-slate-500';
    return (
      <span className="inline-flex items-center gap-2 px-2 py-0.5 mx-1 bg-slate-900/50 rounded border border-slate-700 align-middle">
        <span className="text-[10px] text-gray-400 font-mono">RSI {value.toFixed(1)}</span>
        <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
          <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
        </div>
      </span>
    );
  }
  if (type === 'MACD') {
    const isBullish = value > 0;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-slate-900/50 rounded border border-slate-700 align-middle ${isBullish ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
        <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent ${isBullish ? 'border-b-[6px] border-b-emerald-400' : 'border-t-[6px] border-t-red-400'}`} />
        <span className={`text-[10px] font-mono ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>MACD {value.toFixed(3)}</span>
      </span>
    );
  }
  return null;
};

const renderContentWithWidgets = (content: string) => {
  const regex = /(RSI:?\s*(\d+(?:\.\d+)?))|(MACD:?\s*(-?\d+(?:\.\d+)?))/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const pre = content.substring(lastIndex, match.index);
    if (pre) elements.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: pre.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);

    if (match[1]) {
      const val = parseFloat(match[2]);
      elements.push(<MicroWidget key={match.index} type="RSI" value={val} />);
    } else if (match[3]) {
      const val = parseFloat(match[4]);
      elements.push(<MicroWidget key={match.index} type="MACD" value={val} />);
    }

    lastIndex = regex.lastIndex;
  }

  const remaining = content.substring(lastIndex);
  if (remaining) elements.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: remaining.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);

  return elements;
};

// Format timestamp for terminal style
const formatTimestamp = (id: string) => {
  // Extract timestamp from message id if available, otherwise use current time
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, isLoading, sources, id } = message;
  const isUser = role === 'user';
  const timestamp = formatTimestamp(id);

  return (
    <div className={`terminal-entry animate-fadeIn ${isUser ? 'border-l-purple-500/50' : 'border-l-cyan-500/50'}`}>
      {/* Terminal Header Line */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-slate-600">{timestamp}</span>
        <span className={`text-[10px] font-bold tracking-wider ${isUser ? 'text-purple-400' : 'text-cyan-400'}`}>
          {isUser ? '[USER]' : '[AEGIS]'}
        </span>
        {!isUser && !isLoading && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-slate-600 font-mono">OK</span>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] text-amber-500 font-mono">PROCESSING</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="text-sm text-slate-300 leading-relaxed pl-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner className="w-3 h-3" />
            <span className="text-slate-500 animate-pulse font-mono text-xs">Analyzing market data...</span>
          </div>
        ) : (
          <div className="font-mono text-[13px]">
            {renderContentWithWidgets(content)}
          </div>
        )}
      </div>

      {/* Sources */}
      {!isUser && !isLoading && sources && sources.length > 0 && (
        <div className="mt-2 pl-4">
          <span className="text-[9px] text-slate-600 font-mono mr-2">SOURCES:</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {sources.map((source, index) => (
              <SourceLink key={index} source={source} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
