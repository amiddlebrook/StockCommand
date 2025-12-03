import React from 'react';
import type { PortfolioReportData } from '../types';

interface PortfolioReportWidgetProps {
  id: string;
  title: string;
  data: PortfolioReportData;
  onRemove: (id: string) => void;
}

export const PortfolioReportWidget: React.FC<PortfolioReportWidgetProps> = ({ id, title, data, onRemove }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Portfolio Intelligence</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="text-gray-500 hover:text-red-400 transition-colors"
          aria-label="Remove portfolio widget"
        >
          ×
        </button>
      </header>
      <div className="grid md:grid-cols-3 gap-6 p-6">
        <section className="md:col-span-2">
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{data.summary}</p>
          <div className="mt-6">
            <h4 className="text-xs uppercase text-gray-400 mb-2">Strategic Playbook</h4>
            <ul className="space-y-2">
              {data.playbook.map((item, index) => (
                <li key={index} className="text-sm text-gray-300 flex gap-3">
                  <span className="text-cyan-400 font-semibold">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <h4 className="text-xs uppercase text-gray-400 mb-2">Allocations</h4>
          <div className="space-y-2">
            {data.allocations.map(allocation => (
              <div key={allocation.symbol} className="flex items-center justify-between text-sm bg-slate-900/60 rounded-xl border border-slate-700/40 px-3 py-2">
                <div>
                  <p className="font-semibold text-white">{allocation.symbol}</p>
                  <p className="text-xs text-gray-400">{allocation.thesis}</p>
                </div>
                <span className="text-cyan-400 font-semibold">{(allocation.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h4 className="text-xs uppercase text-gray-400 mb-2">Risk Notes</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              {data.riskNotes.map((note, index) => (
                <li key={index}>• {note}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <footer className="px-6 pb-5">
        <h4 className="text-xs uppercase text-gray-400 mb-3">Holdings</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.holdings.map(holding => (
            <div key={holding.symbol} className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between text-sm text-gray-200">
                <p className="font-semibold">{holding.symbol}</p>
                <p className={holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {holding.changePercent.toFixed(2)}%
                </p>
              </div>
              <p className="text-xs text-gray-400">${holding.price.toFixed(2)} • {holding.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Generated {new Date(data.generatedAt).toLocaleString()} via {data.modelUsed ?? 'hybrid LLM'}</p>
      </footer>
    </div>
  );
};
