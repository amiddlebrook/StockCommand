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
        className="text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3 py-1 transition-colors inline-block border border-gray-700"
    >
        {index + 1}. {source.web.title}
    </a>
);


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, isLoading, sources } = message;
  const isUser = role === 'user';

  const contentWithLineBreaks = content.replace(/\n/g, '<br />');

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center">
          <Icon icon="bot" className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`max-w-2xl w-full ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 inline-block text-sm ${isUser ? 'bg-cyan-800 text-white' : 'bg-gray-800 text-gray-200'}`}>
          {isLoading ? (
            <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span>Thinking...</span>
            </div>
          ) : (
             <div dangerouslySetInnerHTML={{ __html: contentWithLineBreaks }} />
          )}
        </div>
        {!isUser && !isLoading && (
            <div className="mt-3">
                {sources && sources.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs font-semibold mb-2 text-gray-400 tracking-wider uppercase">Sources:</h4>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((source, index) => (
                                <SourceLink key={index} source={source} index={index} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
          U
        </div>
      )}
    </div>
  );
};