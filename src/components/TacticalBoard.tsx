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
    <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[var(--neon-purple)]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Tactical Formation Board
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-[rgba(157,78,221,0.15)] border border-[rgba(157,78,221,0.3)] text-[10px] font-mono text-[var(--neon-purple)] font-bold">
          Active Shift: {minuteKey}'
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* The Pitch View */}
        <div className="pitch-container">
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
                className="player-node team-home"
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
                className="player-node team-away"
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
        <div className="flex flex-col gap-4">
          {/* Argentina Formation Card */}
          <div className="bg-[rgba(11,15,25,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🇦🇷</span>
                <span className="text-xs font-black text-[var(--arg-blue)]">ARGENTINA</span>
              </div>
              <span className="text-xs font-black font-mono text-white bg-gray-800 px-2 py-0.5 rounded">
                {home.formation}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {home.description}
            </p>
          </div>

          {/* France Formation Card */}
          <div className="bg-[rgba(11,15,25,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🇫🇷</span>
                <span className="text-xs font-black text-[var(--fra-blue-light)]">FRANCE</span>
              </div>
              <span className="text-xs font-black font-mono text-white bg-gray-800 px-2 py-0.5 rounded">
                {away.formation}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {away.description}
            </p>
          </div>

          {/* AI Tactical Explanation Board */}
          <div className="bg-[rgba(157,78,221,0.04)] border border-[rgba(157,78,221,0.12)] rounded-xl p-4 flex flex-col gap-2.5">
            <h4 className="text-[10px] font-black uppercase text-[var(--neon-purple)] tracking-widest flex items-center gap-1">
              <Eye size={12} />
              AI Tactical Shift Explainer
            </h4>
            
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Why:</span>
                <p className="text-[11px] text-gray-300 leading-normal">{away.whyChanged || home.whyChanged}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-[rgba(57,255,20,0.03)] border border-[rgba(57,255,20,0.08)] p-2 rounded-lg">
                  <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame size={10} /> BENEFIT
                  </span>
                  <p className="text-[10px] text-gray-300 mt-1 leading-tight">{away.expectedBenefit || home.expectedBenefit}</p>
                </div>
                
                <div className="bg-[rgba(255,56,96,0.03)] border border-[rgba(255,56,96,0.08)] p-2 rounded-lg">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    ⚠️ RISK
                  </span>
                  <p className="text-[10px] text-gray-300 mt-1 leading-tight">{away.risk || home.risk}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
