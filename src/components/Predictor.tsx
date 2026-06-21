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
    <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl flex flex-col gap-6 shadow-xl backdrop-blur-xl">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2.5">
          <BarChart2 size={20} className="text-neon-cyan" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Explainable Win Predictor
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-[10px] font-mono text-neon-cyan font-bold tracking-wider uppercase shadow-sm">
          LIVE PROBABILITIES
        </span>
      </div>

      {/* Percentage splits progress bars */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-xs font-mono font-black text-gray-400 px-1">
          <span className="text-arg-blue">ARG: {currentPred.homeWin}%</span>
          {currentPred.draw > 0 && <span className="text-gray-500">DRAW: {currentPred.draw}%</span>}
          <span className="text-fra-blue-light">FRA: {currentPred.awayWin}%</span>
        </div>

        {/* Triple filled progress bar bar */}
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-arg-blue to-arg-blue/80 transition-all duration-500 shadow-[0_0_12px_var(--color-arg-blue)]"
            style={{ width: `${currentPred.homeWin}%` }}
          />
          {currentPred.draw > 0 && (
            <div
              className="h-full bg-slate-800 transition-all duration-500"
              style={{ width: `${currentPred.draw}%` }}
            />
          )}
          <div
            className="h-full bg-gradient-to-r from-fra-blue-light/80 to-fra-blue-light transition-all duration-500 shadow-[0_0_12px_var(--color-fra-blue-light)]"
            style={{ width: `${currentPred.awayWin}%` }}
          />
        </div>
      </div>

      {/* Explainable Factors list */}
      <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
        <span className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
          <TrendingUp size={14} className="text-neon-cyan" />
          Model Attributes (Explainability Log)
        </span>
        
        <div className="flex flex-col gap-3">
          {currentPred.factors.map((factor, index) => {
            const isArgentina = factor.toLowerCase().includes('argentina') || factor.startsWith('+');
            const isFrance = factor.toLowerCase().includes('france') || factor.startsWith('-');
            const isDraw = factor.toLowerCase().includes('draw') || factor.toLowerCase().includes('shootout') || factor.toLowerCase().includes('even');
            
            let badgeStyle = 'bg-slate-900/60 text-gray-400 border-white/10';
            let dotColor = 'bg-gray-500';

            if (isArgentina) {
              badgeStyle = 'bg-arg-blue/5 text-arg-blue border-arg-blue/20 shadow-sm';
              dotColor = 'bg-arg-blue';
            } else if (isFrance) {
              badgeStyle = 'bg-fra-blue-light/5 text-fra-blue-light border-fra-blue-light/20 shadow-sm';
              dotColor = 'bg-fra-blue-light';
            } else if (isDraw) {
              badgeStyle = 'bg-slate-900/40 text-gray-400 border-white/10';
              dotColor = 'bg-gray-600';
            }

            return (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm leading-normal font-medium ${badgeStyle} transition-all duration-300 hover:scale-[1.02] cursor-default`}
              >
                <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`}></span>
                <span className="font-medium text-gray-200">{factor}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
