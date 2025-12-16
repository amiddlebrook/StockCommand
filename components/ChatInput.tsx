import React, { useState, useRef, ChangeEvent } from 'react';
import { Icon } from './Icon';

interface ChatInputProps {
  onSendMessage: (message: string, image?: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isLoading: boolean;
  initialInput?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStartRecording, onStopRecording, isRecording, isLoading, initialInput }) => {
  const [input, setInput] = useState(initialInput || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialInput) setInput(initialInput);
  }, [initialInput]);

  const handleSend = () => {
    if ((input.trim() || imageFile) && !isLoading) {
      onSendMessage(input, imageFile ?? undefined);
      setInput('');
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-3 bg-gradient-to-t from-slate-950 to-slate-900/50 border-t border-slate-800/50">
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 flex items-end gap-1 shadow-lg">
        {imageFile && (
          <div className="absolute -top-14 left-2 p-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-12 w-12 object-cover rounded" />
            <button onClick={() => setImageFile(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow-lg transition-colors">
              <Icon icon="close" className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        <button
          onClick={triggerFileSelect}
          className="p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-800/50"
          aria-label="Upload image"
        >
          <Icon icon="upload" className="w-5 h-5" />
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`p-2 rounded-lg transition-all ${isRecording
              ? 'text-red-500 bg-red-500/10 animate-pulse'
              : 'text-gray-400 hover:text-cyan-400 hover:bg-slate-800/50'
            }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <Icon icon="mic" className="w-5 h-5" />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything about the markets..."
          className="flex-1 bg-transparent border-none focus:outline-none resize-none text-gray-200 placeholder-gray-500 px-2 py-2 max-h-40 text-sm"
          rows={1}
          disabled={isLoading}
        />

        <button
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && !imageFile)}
          className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white p-2 rounded-lg disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none"
          aria-label="Send message"
        >
          <Icon icon="send" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
