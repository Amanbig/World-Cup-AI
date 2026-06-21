import { useState } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { MomentumChart } from './components/MomentumChart';
import { TacticalBoard } from './components/TacticalBoard';
import { VARCenter } from './components/VARCenter';
import { AIAnalyst } from './components/AIAnalyst';
import { Predictor } from './components/Predictor';
import { Calendar, Users } from 'lucide-react';
import './index.css';

function App() {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const milestones = [
    { minute: 0,   title: 'Kickoff',         subtitle: 'Formations Neutral',       icon: '⚽' },
    { minute: 21,  title: 'Penalty Award',    subtitle: 'Dembele foul on Di Maria', icon: '⚠️' },
    { minute: 23,  title: 'Messi Goal',       subtitle: 'Penalty Kick (1-0)',       icon: '🇦🇷' },
    { minute: 36,  title: 'Di Maria Goal',    subtitle: 'Counter-attack (2-0)',     icon: '🇦🇷' },
    { minute: 41,  title: 'Tactical Shift',   subtitle: 'Deschamps double sub',     icon: '📋' },
    { minute: 80,  title: 'Mbappe Goal',      subtitle: 'Penalty Kick (2-1)',       icon: '🇫🇷' },
    { minute: 81,  title: 'Mbappe Volley',    subtitle: '97s Equalizer (2-2)',      icon: '🇫🇷' },
    { minute: 108, title: 'Messi Goal',       subtitle: 'Extra-time (3-2)',         icon: '🇦🇷' },
    { minute: 118, title: 'Mbappe Hat-trick', subtitle: 'Handball Penalty (3-3)',   icon: '🇫🇷' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0B0F19] text-gray-100 font-sans selection:bg-neon-cyan/30">

      {/* Sticky header */}
      <Header
        currentMinute={currentMinute}
        setCurrentMinute={setCurrentMinute}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-8 flex flex-col gap-8">

        {/* ── Timeline scrubber ── */}
        <Timeline currentMinute={currentMinute} setCurrentMinute={setCurrentMinute} />

        {/* ── 3-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* Win Predictor */}
            <Predictor currentMinute={currentMinute} />

            {/* Match Milestones */}
            <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl shadow-xl backdrop-blur-xl">
              <span className="text-xs font-bold uppercase text-neon-cyan tracking-widest flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Calendar size={14} />
                Match Milestones
              </span>
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {milestones.map((ms, i) => {
                  const isActive = currentMinute >= ms.minute;
                  const isCurrent = currentMinute === ms.minute;
                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrentMinute(ms.minute); setIsPlaying(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                        isCurrent
                          ? 'bg-neon-cyan/15 border-neon-cyan/40 text-white shadow-[0_4px_15px_rgba(0,216,246,0.15)] scale-[1.02]'
                          : isActive
                          ? 'bg-slate-800/60 border-white/10 text-gray-200 hover:bg-slate-800 hover:border-white/20'
                          : 'bg-slate-900/40 border-transparent text-gray-500 hover:text-gray-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-base shrink-0">{ms.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-sm truncate">{ms.title}</span>
                          <span className="font-mono text-xs text-gray-400 shrink-0 ml-2">{ms.minute}'</span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{ms.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Tactical Shapers */}
            <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl shadow-xl backdrop-blur-xl hidden xl:flex flex-col">
              <span className="text-xs font-bold uppercase text-neon-purple tracking-widest flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Users size={14} />
                Key Tactical Shapers
              </span>
              <div className="flex flex-col gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🇦🇷</span>
                    <span className="text-xs font-bold text-arg-blue tracking-wider">ARGENTINA</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">L. Messi (CF)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">A. Di Maria (LW)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">Enzo F. (DM)</span>
                  </div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🇫🇷</span>
                    <span className="text-xs font-bold text-fra-blue-light tracking-wider">FRANCE</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">K. Mbappe (CF)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">A. Griezmann (AM)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300">O. Dembele (RW)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="flex flex-col gap-8 min-w-0">
            <MomentumChart currentMinute={currentMinute} />
            <TacticalBoard currentMinute={currentMinute} />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-8">
            <VARCenter currentMinute={currentMinute} />
            <AIAnalyst currentMinute={currentMinute} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
