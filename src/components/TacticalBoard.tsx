import React from 'react';
import { Shield, Eye, Flame } from 'lucide-react';
import { matchData } from '../data/matchData';

interface TacticalBoardProps {
  currentMinute: number;
}

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ currentMinute }) => {
  // Select active formation based on current minute
  const getActiveFormation = (minute: number) => {
    let activeKey = 0;
    const keys = Object.keys(matchData.formations)
      .map(Number)
      .sort((a, b) => a - b);
    
    keys.forEach((key) => {
      if (minute >= key) {
        activeKey = key;
      }
    });

    return {
      minuteKey: activeKey,
      home: matchData.formations[activeKey].home,
      away: matchData.formations[activeKey].away
    };
  };

  const { minuteKey, home, away } = getActiveFormation(currentMinute);

  return (
    <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl flex flex-col gap-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <Shield size={20} className="text-neon-purple" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Tactical Formation Board
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-neon-purple/15 border border-neon-purple/35 text-xs font-mono text-neon-purple font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(157,78,221,0.2)]">
          FORMATION AT {minuteKey}'
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Pitch View */}
        <div className="pitch-container border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
          <div className="pitch-overlay">
            {/* Field Markings */}
            <div className="pitch-center-line"></div>
            <div className="pitch-center-circle"></div>
            <div className="pitch-center-spot"></div>
            
            <div className="pitch-penalty-box-top"></div>
            <div className="pitch-six-yard-top"></div>
            <div className="pitch-goal-top"></div>
            
            <div className="pitch-penalty-box-bottom"></div>
            <div className="pitch-six-yard-bottom"></div>
            <div className="pitch-goal-bottom"></div>

            {/* Argentina Players (Home) - Blue Circles */}
            {home.players.map((player) => (
              <div
                key={player.id}
                className="player-node team-home transition-all duration-[800ms]"
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`
                }}
              >
                {player.number}
                <div className="player-label">
                  {player.name}
                </div>
              </div>
            ))}

            {/* France Players (Away) - Dark Blue/Navy Circles */}
            {away.players.map((player) => (
              <div
                key={player.id}
                className="player-node team-away transition-all duration-[800ms]"
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`
                }}
              >
                {player.number}
                <div className="player-label">
                  {player.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Shift Details Panel */}
        <div className="flex flex-col gap-5">
          {/* Argentina Formation Card */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇦🇷</span>
                <span className="text-xs font-bold text-arg-blue tracking-wider">ARGENTINA</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-md border border-white/10">
                {home.formation}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              {home.description}
            </p>
          </div>

          {/* France Formation Card */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇫🇷</span>
                <span className="text-xs font-bold text-fra-blue-light tracking-wider">FRANCE</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-md border border-white/10">
                {away.formation}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              {away.description}
            </p>
          </div>

          {/* AI Tactical Explanation Board */}
          <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-2xl p-5 flex flex-col gap-3 shadow-lg mt-1">
            <h4 className="text-xs font-bold uppercase text-neon-purple tracking-widest flex items-center gap-2 border-b border-neon-purple/10 pb-2 mb-1">
              <Eye size={14} />
              AI Tactical Shift Explainer
            </h4>
            
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">TACTICAL RATIONALE:</span>
                <p className="text-sm text-gray-200 leading-relaxed font-medium">{away.whyChanged || home.whyChanged}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl">
                  <span className="text-xs font-mono font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <Flame size={12} /> BENEFIT
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">{away.expectedBenefit || home.expectedBenefit}</p>
                </div>
                
                <div className="bg-danger/10 border border-danger/20 p-3.5 rounded-xl">
                  <span className="text-xs font-mono font-bold text-danger uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    ⚠️ RISK
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">{away.risk || home.risk}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
