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
    <div className="glass-panel p-5 border-white/5 bg-slate-900/40 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-neon-purple" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white">
            Tactical Formation Board
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-neon-purple/10 border border-neon-purple/35 text-[9px] font-mono text-neon-purple font-bold tracking-wider uppercase">
          FORMATION AT {minuteKey}'
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* The Pitch View */}
        <div className="pitch-container border-2 border-white/5 rounded-xl overflow-hidden shadow-2xl">
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
                <div className="player-label text-[7px] font-bold py-0.5 px-1.5 rounded bg-slate-950/90 border border-white/15">
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
                <div className="player-label text-[7px] font-bold py-0.5 px-1.5 rounded bg-slate-950/90 border border-white/15">
                  {player.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Shift Details Panel */}
        <div className="flex flex-col gap-4">
          {/* Argentina Formation Card */}
          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🇦🇷</span>
                <span className="text-[10px] font-black text-arg-blue tracking-wider">ARGENTINA</span>
              </div>
              <span className="text-[9px] font-mono font-black text-white bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                {home.formation}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
              {home.description}
            </p>
          </div>

          {/* France Formation Card */}
          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🇫🇷</span>
                <span className="text-[10px] font-black text-fra-blue-light tracking-wider">FRANCE</span>
              </div>
              <span className="text-[9px] font-mono font-black text-white bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                {away.formation}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
              {away.description}
            </p>
          </div>

          {/* AI Tactical Explanation Board */}
          <div className="bg-neon-purple/5 border border-neon-purple/15 rounded-xl p-4 flex flex-col gap-2.5">
            <h4 className="text-[9px] font-black uppercase text-neon-purple tracking-widest flex items-center gap-1.5 border-b border-neon-purple/10 pb-1.5 mb-0.5">
              <Eye size={12} />
              AI Tactical Shift Explainer
            </h4>
            
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest block">TACTICAL RATIONALE:</span>
                <p className="text-[11px] text-gray-300 leading-normal font-medium mt-1">{away.whyChanged || home.whyChanged}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div className="bg-green-500/5 border border-green-500/10 p-2.5 rounded-xl">
                  <span className="text-[9px] font-mono font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                    <Flame size={10} /> BENEFIT
                  </span>
                  <p className="text-[10px] text-gray-300 mt-1 leading-normal font-semibold">{away.expectedBenefit || home.expectedBenefit}</p>
                </div>
                
                <div className="bg-danger/5 border border-danger/10 p-2.5 rounded-xl">
                  <span className="text-[9px] font-mono font-black text-danger uppercase tracking-widest flex items-center gap-1">
                    ⚠️ RISK
                  </span>
                  <p className="text-[10px] text-gray-300 mt-1 leading-normal font-semibold">{away.risk || home.risk}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
