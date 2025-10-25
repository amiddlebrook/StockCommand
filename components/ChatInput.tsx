import React, { useState, useRef, ChangeEvent } from 'react';
import { Icon } from './Icon';

interface ChatInputProps {
  onSendMessage: (message: string, image?: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStartRecording, onStopRecording, isRecording, isLoading }) => {
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((input.trim() || imageFile) && !isLoading) {
      onSendMessage(input, imageFile ?? undefined);
      setInput('');
      setImageFile(null);
      if(fileInputRef.current) {
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
    <div className="p-2 bg-black border-t border-gray-800">
      <div className="relative bg-black border border-gray-700 p-2 flex items-end">
        {imageFile && (
          <div className="absolute -bottom-12 left-2 p-1 bg-gray-900 border border-gray-700 shadow-lg">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-10 w-10 object-cover" />
            <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 p-0.5">
              <Icon icon="close" className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
        <button onClick={triggerFileSelect} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Icon icon="upload" />
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        <button onClick={isRecording ? onStopRecording : onStartRecording} className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}>
            <Icon icon="mic" />
        </button>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a follow-up..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-gray-200 placeholder-gray-500 px-2 max-h-40"
          rows={2}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || (!input.trim() && !imageFile)} className="bg-cyan-600 text-white p-2 disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors">
          <Icon icon="send" className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};