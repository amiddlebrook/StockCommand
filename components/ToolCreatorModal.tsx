import React, { useState } from 'react';
import { Icon } from './Icon';
import { generateTool, type CustomTool } from '../services/customToolsService';

interface ToolCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolCreated: (tool: CustomTool) => void;
}

export const ToolCreatorModal: React.FC<ToolCreatorModalProps> = ({
  isOpen,
  onClose,
  onToolCreated,
}) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const tool = await generateTool(description);
      onToolCreated(tool);
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tool');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-700/50 rounded-lg shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Create Custom Tool
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Describe the analysis tool you want, and AI will build it for you
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <Icon icon="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="tool-description" className="block text-sm font-medium text-gray-300 mb-2">
              Tool Description
            </label>
            <textarea
              id="tool-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Create a tool that analyzes a company's dividend history and sustainability score"
              rows={4}
              disabled={isGenerating}
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about what data you want to see and how it should be displayed
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Icon icon="bot" className="w-4 h-4 text-purple-400" />
              <span>Powered by Qwen 3 Coder</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!description.trim() || isGenerating}
                className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  'Create Tool'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Examples */}
        <div className="px-6 pb-6">
          <p className="text-xs font-medium text-gray-400 mb-2">Example ideas:</p>
          <div className="space-y-1">
            {[
              'Dividend sustainability analyzer',
              'Short interest tracker',
              'Insider trading monitor',
              'Revenue growth forecast',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDescription(`Create a tool that ${example}`)}
                disabled={isGenerating}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors block disabled:opacity-50"
              >
                • {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
