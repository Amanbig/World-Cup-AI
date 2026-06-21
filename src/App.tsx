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
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 font-sans pb-12 selection:bg-neon-cyan/30">
      
      {/* Top Banner and Navigation */}
      <Header
        currentMinute={currentMinute}
        setCurrentMinute={setCurrentMinute}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <main className="max-w-[1700px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        
        {/* Timeline Intelligence Scrub bar */}
        <div className="w-full">
          <Timeline
            currentMinute={currentMinute}
            setCurrentMinute={setCurrentMinute}
          />
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* COLUMN 1: LEFT SIDEBAR (Match Navigation & Predictor) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Win Predictor Panel */}
            <Predictor currentMinute={currentMinute} />

            {/* Match Milestones Navigation */}
            <div className="glass-panel p-5 border-white/5 bg-slate-900/40">
              <span className="text-[10px] font-black uppercase text-neon-cyan tracking-widest flex items-center gap-1.5 border-b border-gray-800 pb-2 mb-3">
                <Calendar size={12} />
                MATCH MILESTONES (NAVIGATE)
              </span>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
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
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-neon-cyan/10 border-neon-cyan/40 text-white shadow-lg'
                          : isActive
                          ? 'bg-slate-950/40 border-white/5 text-gray-300 hover:border-white/10'
                          : 'bg-slate-950/10 border-transparent text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      <span className="text-sm shrink-0">{ms.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-xs truncate">{ms.title}</span>
                          <span className="font-mono text-[9px] text-gray-500 font-bold shrink-0">{ms.minute}'</span>
                        </div>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{ms.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Roster / Key Figures */}
            <div className="glass-panel p-5 border-white/5 bg-slate-900/40 hidden xl:flex flex-col">
              <span className="text-[10px] font-black uppercase text-neon-purple tracking-widest flex items-center gap-1.5 border-b border-gray-800 pb-2 mb-3">
                <Users size={12} />
                KEY TACTICAL SHAPERS
              </span>
              
              <div className="flex flex-col gap-3">
                {/* Argentina */}
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span>🇦🇷</span>
                    <span className="text-[10px] font-bold text-arg-blue">ARGENTINA</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">L. Messi (CF)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">A. Di Maria (LW)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">Enzo F. (DM)</span>
                  </div>
                </div>

                {/* France */}
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span>🇫🇷</span>
                    <span className="text-[10px] font-bold text-fra-blue-light">FRANCE</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">K. Mbappe (CF)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">A. Griezmann (AM)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-gray-300 font-medium">O. Dembele (RW)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2 & 3: CENTER MAIN PANEL (Pitch & Momentum) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Live Momentum swing area chart */}
            <MomentumChart currentMinute={currentMinute} />

            {/* Tactical animated Pitch */}
            <TacticalBoard currentMinute={currentMinute} />
          </div>

          {/* COLUMN 4: RIGHT SIDEBAR (VAR & AI Analyst) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
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
