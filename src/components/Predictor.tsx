import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { matchData } from '../data/matchData';

interface PredictorProps {
  currentMinute: number;
}

export const Predictor: React.FC<PredictorProps> = ({ currentMinute }) => {
  // Get prediction data at current minute
  const getPredictionAtMinute = (minute: number) => {
    let active = matchData.predictions[0];
    matchData.predictions.forEach((p) => {
      if (minute >= p.minute) {
        active = p;
      }
    });
    return active;
  };

  const currentPred = getPredictionAtMinute(currentMinute);

  return (
    <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] flex flex-col gap-4">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-[var(--neon-cyan)]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Explainable Win Predictor
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-[rgba(0,216,246,0.15)] border border-[rgba(0,216,246,0.3)] text-[10px] font-mono text-[var(--neon-cyan)] font-bold">
          ML MODEL CONFIDENCE
        </span>
      </div>

      {/* Percentage splits progress bars */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-xs font-bold text-gray-300 px-1">
          <span>ARG Win: {currentPred.homeWin}%</span>
          {currentPred.draw > 0 && <span>Draw: {currentPred.draw}%</span>}
          <span>FRA Win: {currentPred.awayWin}%</span>
        </div>

        {/* Triple filled progress bar bar */}
        <div className="w-full h-4 bg-gray-950 rounded-full overflow-hidden flex border border-[rgba(255,255,255,0.06)] shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#a1c8f1] to-[var(--arg-blue)] transition-all duration-500 shadow-[0_0_10px_var(--arg-blue-glow)]"
            style={{ width: `${currentPred.homeWin}%` }}
          />
          {currentPred.draw > 0 && (
            <div
              className="h-full bg-gray-800 transition-all duration-500"
              style={{ width: `${currentPred.draw}%` }}
            />
          )}
          <div
            className="h-full bg-gradient-to-r from-[var(--fra-blue-light)] to-[var(--fra-blue)] transition-all duration-500 shadow-[0_0_10px_var(--fra-blue-glow)]"
            style={{ width: `${currentPred.awayWin}%` }}
          />
        </div>
      </div>

      {/* Explainable Factors list */}
      <div className="bg-[rgba(11,15,25,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 border-b border-gray-800 pb-2">
          <TrendingUp size={12} className="text-[var(--neon-cyan)]" />
          Model Attributes (Explainability Log)
        </span>
        
        <div className="flex flex-col gap-2">
          {currentPred.factors.map((factor, index) => {
            // Figure out styling based on factor contents
            const isArgentina = factor.toLowerCase().includes('argentina') || factor.startsWith('+');
            const isFrance = factor.toLowerCase().includes('france') || factor.startsWith('-');
            const isDraw = factor.toLowerCase().includes('draw') || factor.toLowerCase().includes('shootout') || factor.toLowerCase().includes('even');
            
            let badgeStyle = 'bg-gray-800 text-gray-300 border-gray-700';
            let dotColor = 'bg-gray-400';

            if (isArgentina) {
              badgeStyle = 'bg-[rgba(116,172,223,0.1)] text-[var(--arg-blue)] border-[rgba(116,172,223,0.2)]';
              dotColor = 'bg-[var(--arg-blue)]';
            } else if (isFrance) {
              badgeStyle = 'bg-[rgba(42,82,190,0.12)] text-[var(--fra-blue-light)] border-[rgba(42,82,190,0.2)]';
              dotColor = 'bg-[var(--fra-blue-light)]';
            } else if (isDraw) {
              badgeStyle = 'bg-gray-850 text-gray-400 border-gray-700';
              dotColor = 'bg-gray-500';
            }

            return (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${badgeStyle} animate-fade-in`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                <span className="font-medium">{factor}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
