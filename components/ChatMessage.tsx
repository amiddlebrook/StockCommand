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


const MicroWidget: React.FC<{ type: string, value: number, context?: string }> = ({ type, value, context }) => {
  if (type === 'RSI') {
    // RSI Bar: 0-100
    const color = value > 70 ? 'bg-red-500' : value < 30 ? 'bg-emerald-500' : 'bg-slate-500';
    const label = value > 70 ? 'Overbought' : value < 30 ? 'Oversold' : 'Neutral';
    return (
      <span className="inline-flex items-center gap-2 px-2 py-0.5 mx-1 bg-slate-900/50 rounded border border-slate-700 align-middle">
        <span className="text-[10px] text-gray-400 font-mono">RSI {value.toFixed(1)}</span>
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
          <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
        </div>
        {/* <span className={`text-[9px] ${value > 70 ? 'text-red-400' : value < 30 ? 'text-emerald-400' : 'text-gray-500'}`}>{label}</span> */}
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
  // Regex to split by interesting data points
  // Pattern: RSI: 12.34
  // Pattern: MACD: -0.123
  const regex = /(RSI:?\s*(\d+(?:\.\d+)?))|(MACD:?\s*(-?\d+(?:\.\d+)?))/g;

  // We can't easily map regex match to component in a single pass of raw string with HTML logic
  // Simplified approach: Split by regex, keep delimiters.

  const parts = content.split(regex);
  // split(regex) with capturing groups returns: [pre, match, rsi_group, rsi_val, macd_group, macd_val, post, ...]

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  let match;
  // We need to iterate matches to reconstructing properly
  while ((match = regex.exec(content)) !== null) {
    const pre = content.substring(lastIndex, match.index);
    if (pre) elements.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: pre.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);

    if (match[1]) { // RSI
      const val = parseFloat(match[2]);
      elements.push(<MicroWidget key={match.index} type="RSI" value={val} />);
    } else if (match[3]) { // MACD
      const val = parseFloat(match[4]);
      elements.push(<MicroWidget key={match.index} type="MACD" value={val} />);
    }

    lastIndex = regex.lastIndex;
  }

  const remaining = content.substring(lastIndex);
  if (remaining) elements.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: remaining.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);

  return elements;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, isLoading, sources } = message;
  const isUser = role === 'user';

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
        <div className={`px-4 py-3 inline-block text-sm rounded-2xl shadow-lg ${isUser
            ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 text-white rounded-tr-sm'
            : 'bg-slate-800/50 backdrop-blur-sm text-gray-100 border border-slate-700/50 rounded-tl-sm'
          }`}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <LoadingSpinner className="w-4 h-4" />
              <span className="text-cyan-400 animate-pulse">Analyzing...</span>
            </div>
          ) : (
            <div className="leading-relaxed">
              {renderContentWithWidgets(content)}
            </div>
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
