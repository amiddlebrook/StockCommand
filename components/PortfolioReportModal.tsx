import React, { useEffect, useMemo, useState } from 'react';

interface PortfolioReportModalProps {
  isOpen: boolean;
  symbols: string[];
  activeSymbol: string | null;
  isGenerating: boolean;
  onClose: () => void;
  onSubmit: (tickers: string[], goal: string) => void;
}

export const PortfolioReportModal: React.FC<PortfolioReportModalProps> = ({
  isOpen,
  symbols,
  activeSymbol,
  isGenerating,
  onClose,
  onSubmit,
}) => {
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [goal, setGoal] = useState('Growth with disciplined risk management.');

  useEffect(() => {
    if (isOpen) {
      const next = new Set<string>();
      if (activeSymbol) {
        next.add(activeSymbol);
      }
      setSelectedTickers(next);
    }
  }, [isOpen, activeSymbol]);

  const orderedSymbols = useMemo(() => {
    if (!activeSymbol) {
      return symbols;
    }
    const rest = symbols.filter(symbol => symbol !== activeSymbol);
    return [activeSymbol, ...rest];
  }, [symbols, activeSymbol]);

  if (!isOpen) {
    return null;
  }

  const toggleTicker = (symbol: string) => {
    setSelectedTickers(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const tickers = selectedTickers.size > 0 ? Array.from(selectedTickers) : orderedSymbols.slice(0, 3);
    onSubmit(tickers, goal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-700/40 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Portfolio Studio</p>
            <h3 className="text-lg font-semibold text-white">Generate a Multi-Symbol Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close portfolio report modal"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-5 space-y-6">
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-3">Select Focus Tickers</p>
            <div className="flex flex-wrap gap-2">
              {orderedSymbols.length === 0 && (
                <p className="text-xs text-gray-500 italic">Add symbols in the toolbox first.</p>
              )}
              {orderedSymbols.map(symbol => {
                const isSelected = selectedTickers.has(symbol);
                return (
                  <button
                    key={symbol}
                    onClick={() => toggleTicker(symbol)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-mono transition-all ${
                      isSelected
                        ? 'bg-cyan-600/80 border-cyan-400 text-white shadow-cyan-500/30 shadow'
                        : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    {symbol}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">Leave empty to include your top three watchlist names.</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Investor Goal</p>
            <textarea
              value={goal}
              onChange={event => setGoal(event.target.value)}
              rows={3}
              className="w-full bg-slate-950/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="e.g., Income focus with downside protection"
            />
          </div>
        </div>
        <footer className="px-6 py-4 border-t border-slate-700/40 flex items-center justify-end gap-3 bg-slate-900/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-gray-300 hover:bg-slate-800"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || orderedSymbols.length === 0}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isGenerating ? 'Generating…' : 'Generate Report'}
          </button>
        </footer>
      </div>
    </div>
  );
};
