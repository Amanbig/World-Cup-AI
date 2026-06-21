import React, { useEffect } from 'react';
import { Play, Pause, RefreshCw, Radio } from 'lucide-react';
import { matchData } from '../data/matchData';
interface HeaderProps {
  currentMinute: number;
  setCurrentMinute: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMinute,
  setCurrentMinute,
  isPlaying,
  setIsPlaying
}) => {
  // Auto increment minute when playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMinute((prev) => {
          if (prev >= 120) {
            setIsPlaying(false);
            return 120;
          }
          return prev + 1;
        });
      }, 1000); // 1 minute per second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, setCurrentMinute, setIsPlaying]);

  // Determine current scores at current minute
  const getScoresAtMinute = (minute: number) => {
    let homeScore = 0;
    let awayScore = 0;
    
    // Count goals up to this minute
    matchData.events.forEach(event => {
      if (event.minute <= minute && event.type === 'goal') {
        if (event.team === 'Argentina') homeScore++;
        if (event.team === 'France') awayScore++;
      }
    });

    return { homeScore, awayScore };
  };

  const { homeScore, awayScore } = getScoresAtMinute(currentMinute);

  const getMatchStage = (minute: number) => {
    if (minute === 0) return 'PRE-MATCH';
    if (minute < 45) return '1ST HALF';
    if (minute === 45) return 'HALF TIME';
    if (minute < 90) return '2ND HALF';
    if (minute === 90) return 'FULL TIME';
    if (minute < 120) return 'EXTRA TIME';
    return 'EXTRA TIME FT';
  };

  return (
    <header className="w-full border-b border-[rgba(255,255,255,0.08)] bg-[#0B0F19] z-50 sticky top-0">
      {/* Ticker Tape */}
      <div className="w-full bg-[rgba(0,216,246,0.05)] border-b border-[rgba(0,216,246,0.1)] py-1.5 px-4 overflow-hidden relative h-8 flex items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--neon-cyan)] animate-pulse shrink-0 mr-4">
          <Radio size={12} />
          <span>LIVE ANALYST FEED:</span>
        </div>
        <div className="whitespace-nowrap text-xs text-[var(--text-secondary)] flex gap-12 animate-marquee">
          <span>🔥 World Cup Final Simulation: Argentina vs France</span>
          <span>⚽ 23' Lionel Messi Penalty Goal</span>
          <span>⚽ 36' Angel Di Maria Counter-Attack Goal</span>
          <span>🔄 41' Tactical Shift: France substitutions change shape to 4-2-4</span>
          <span>⚽ 80' Kylian Mbappe penalty narrows gap</span>
          <span>⚽ 81' Kylian Mbappe volley equalizes in 97 seconds</span>
          <span>⚽ 108' Lionel Messi scores goal of the tournament</span>
          <span>⚽ 118' Kylian Mbappe hat-trick penalty ties again!</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        {/* Logo and Pitch */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--neon-cyan)] to-[var(--neon-purple)] flex items-center justify-center shadow-lg shadow-[rgba(0,216,246,0.2)]">
            <span className="font-black text-white text-lg tracking-wider">ETG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ExplainTheGame <span className="text-[var(--neon-cyan)] font-extrabold">AI</span>
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-widest">
              Granite-Powered Analyst Engine
            </p>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-6 glass-panel px-6 py-2.5 border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.6)] shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{matchData.teams.home.logo}</span>
            <span className="font-bold text-sm text-[var(--text-primary)] hidden sm:inline">ARGENTINA</span>
            <span className="font-bold text-sm text-[var(--text-primary)] sm:hidden">ARG</span>
          </div>
          
          <div className="flex items-center gap-3 font-mono">
            <span className="text-3xl font-black text-white tracking-tighter w-8 text-center">{homeScore}</span>
            <span className="text-xl font-bold text-[var(--text-muted)]">:</span>
            <span className="text-3xl font-black text-white tracking-tighter w-8 text-center">{awayScore}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[var(--text-primary)] hidden sm:inline">FRANCE</span>
            <span className="font-bold text-sm text-[var(--text-primary)] sm:hidden">FRA</span>
            <span className="text-2xl">{matchData.teams.away.logo}</span>
          </div>

          <div className="h-6 w-[1px] bg-[rgba(255,255,255,0.1)]"></div>

          <div className="flex flex-col items-center justify-center min-w-[70px]">
            <span className="text-[11px] font-bold text-[var(--neon-cyan)] font-mono uppercase tracking-wider">
              {getMatchStage(currentMinute)}
            </span>
            <span className="text-lg font-black text-white font-mono tracking-widest glow-text-cyan">
              {currentMinute}'
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              isPlaying 
                ? 'bg-[rgba(255,56,96,0.15)] text-[var(--danger)] border border-[rgba(255,56,96,0.3)] shadow-[0_0_15px_rgba(255,56,96,0.1)]' 
                : 'bg-[rgba(0,216,246,0.15)] text-[var(--neon-cyan)] border border-[rgba(0,216,246,0.3)] shadow-[0_0_15px_rgba(0,216,246,0.1)]'
            } hover:scale-105`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'PAUSE LIVE' : 'PLAY LIVE SIM'}</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentMinute(0);
              setIsPlaying(false);
            }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all border border-gray-700 hover:scale-105"
            title="Reset Timeline"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
