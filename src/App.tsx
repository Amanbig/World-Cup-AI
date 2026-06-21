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

  // Key match milestones for left sidebar quick-navigation
  const milestones = [
    { minute: 0, title: "Kickoff", subtitle: "Formations Neutral", icon: "⚽" },
    { minute: 21, title: "Penalty Award", subtitle: "Dembele foul on Di Maria", icon: "⚠️" },
    { minute: 23, title: "Messi Goal", subtitle: "Penalty Kick (1-0)", icon: "🇦🇷" },
    { minute: 36, title: "Di Maria Goal", subtitle: "Counter-attack (2-0)", icon: "🇦🇷" },
    { minute: 41, title: "Tactical Shift", subtitle: "Deschamps double sub", icon: "📋" },
    { minute: 80, title: "Mbappe Goal", subtitle: "Penalty Kick (2-1)", icon: "🇫🇷" },
    { minute: 81, title: "Mbappe Volley", subtitle: "97s Equalizer (2-2)", icon: "🇫🇷" },
    { minute: 108, title: "Messi Goal", subtitle: "Extra-time (3-2)", icon: "🇦🇷" },
    { minute: 118, title: "Mbappe Hat-trick", subtitle: "Handball Penalty (3-3)", icon: "🇫🇷" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 font-sans pb-16 selection:bg-neon-cyan/30">
      
      {/* Top Banner and Navigation */}
      <Header
        currentMinute={currentMinute}
        setCurrentMinute={setCurrentMinute}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <main className="max-w-[1800px] w-full mx-auto px-6 md:px-10 py-8 flex flex-col gap-8">
        
        {/* Timeline Intelligence Scrub bar */}
        <div className="w-full">
          <Timeline
            currentMinute={currentMinute}
            setCurrentMinute={setCurrentMinute}
          />
        </div>

        {/* 3-Column Layout with generous spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* COLUMN 1: LEFT SIDEBAR (Match Navigation & Predictor) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* Win Predictor Panel */}
            <Predictor currentMinute={currentMinute} />

            {/* Match Milestones Navigation */}
            <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl shadow-xl backdrop-blur-xl">
              <span className="text-xs font-bold uppercase text-neon-cyan tracking-widest flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Calendar size={14} />
                Match Milestones
              </span>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {milestones.map((ms, index) => {
                  const isActive = currentMinute >= ms.minute;
                  const isCurrent = currentMinute === ms.minute;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentMinute(ms.minute);
                        setIsPlaying(false);
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all duration-300 ease-in-out cursor-pointer ${
                        isCurrent
                          ? 'bg-neon-cyan/15 border-neon-cyan/40 text-white shadow-[0_4px_15px_rgba(0,216,246,0.15)] scale-[1.02]'
                          : isActive
                          ? 'bg-slate-800/60 border-white/10 text-gray-200 hover:bg-slate-800 hover:border-white/20 hover:scale-[1.01]'
                          : 'bg-slate-900/40 border-transparent text-gray-500 hover:text-gray-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-lg shrink-0">{ms.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-sm truncate">{ms.title}</span>
                          <span className="font-mono text-xs text-gray-400 font-bold shrink-0">{ms.minute}'</span>
                        </div>
                        <p className={`text-xs truncate ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{ms.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Roster / Key Figures */}
            <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl shadow-xl backdrop-blur-xl hidden xl:flex flex-col">
              <span className="text-xs font-bold uppercase text-neon-purple tracking-widest flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Users size={14} />
                Key Tactical Shapers
              </span>
              
              <div className="flex flex-col gap-4">
                {/* Argentina */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🇦🇷</span>
                    <span className="text-xs font-bold text-arg-blue tracking-wider">ARGENTINA</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">L. Messi (CF)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">A. Di Maria (LW)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">Enzo F. (DM)</span>
                  </div>
                </div>

                {/* France */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🇫🇷</span>
                    <span className="text-xs font-bold text-fra-blue-light tracking-wider">FRANCE</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">K. Mbappe (CF)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">A. Griezmann (AM)</span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/10 text-xs text-gray-300 font-medium">O. Dembele (RW)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2 & 3: CENTER MAIN PANEL (Pitch & Momentum) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Live Momentum swing area chart */}
            <MomentumChart currentMinute={currentMinute} />

            {/* Tactical animated Pitch */}
            <TacticalBoard currentMinute={currentMinute} />
          </div>

          {/* COLUMN 4: RIGHT SIDEBAR (VAR & AI Analyst) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* VAR Decision Center */}
            <VARCenter currentMinute={currentMinute} />

            {/* Conversational Analyst */}
            <AIAnalyst currentMinute={currentMinute} />

          </div>

        </div>

      </main>
    </div>
  );
}

export default App;
