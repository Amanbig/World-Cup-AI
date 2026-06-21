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
    <header className="w-full border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl z-50 sticky top-0">
      {/* Ticker Tape */}
      <div className="w-full bg-neon-cyan/5 border-b border-neon-cyan/10 py-1.5 px-4 overflow-hidden relative h-8 flex items-center">
        <div className="flex items-center gap-2 text-xs font-black text-neon-cyan animate-pulse shrink-0 mr-4 tracking-wider">
          <Radio size={12} className="text-neon-cyan" />
          <span>LIVE ANALYST FEED:</span>
        </div>
        <div className="whitespace-nowrap text-[11px] text-gray-400 font-medium flex gap-12 animate-marquee">
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

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between flex-wrap gap-4">
        {/* Logo and Pitch */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-cyan to-neon-purple flex items-center justify-center shadow-lg shadow-neon-cyan/20 border border-white/10">
            <span className="font-black text-white text-lg tracking-wider font-digital">ETG</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              ExplainTheGame <span className="text-neon-cyan font-black">AI</span>
            </h1>
            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">
              Granite-Powered Analyst Engine
            </p>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-6 glass-panel px-6 py-2 border-white/5 bg-slate-950/60 shadow-lg shadow-black/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">{matchData.teams.home.logo}</span>
            <span className="font-black text-xs text-gray-200 tracking-wider hidden sm:inline">ARGENTINA</span>
            <span className="font-black text-xs text-gray-200 tracking-wider sm:hidden">ARG</span>
          </div>
          
          <div className="flex items-center gap-3 font-digital">
            <span className="text-2xl font-black text-white tracking-tighter w-8 text-center">{homeScore}</span>
            <span className="text-lg font-bold text-gray-600">:</span>
            <span className="text-2xl font-black text-white tracking-tighter w-8 text-center">{awayScore}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-black text-xs text-gray-200 tracking-wider hidden sm:inline">FRANCE</span>
            <span className="font-black text-xs text-gray-200 tracking-wider sm:hidden">FRA</span>
            <span className="text-xl">{matchData.teams.away.logo}</span>
          </div>

          <div className="h-6 w-[1px] bg-white/10"></div>

          <div className="flex flex-col items-center justify-center min-w-[70px]">
            <span className="text-[9px] font-black text-neon-cyan font-mono uppercase tracking-wider">
              {getMatchStage(currentMinute)}
            </span>
            <span className="text-base font-black text-white font-digital tracking-wider glow-text-cyan">
              {currentMinute}'
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 border cursor-pointer ${
              isPlaying 
                ? 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_15px_rgba(255,56,96,0.1)] hover:bg-danger/20' 
                : 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 shadow-[0_0_15px_rgba(0,216,246,0.1)] hover:bg-neon-cyan/20'
            } hover:scale-105`}
          >
            {isPlaying ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY SIM'}</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentMinute(0);
              setIsPlaying(false);
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-all border border-slate-700 hover:scale-105 cursor-pointer"
            title="Reset Timeline"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
    </header>
  );
};
