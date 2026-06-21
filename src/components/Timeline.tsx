import React, { useState } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import { matchData } from '../data/matchData';
import type { MatchEvent } from '../data/matchData';

interface TimelineProps {
  currentMinute: number;
  setCurrentMinute: (min: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ currentMinute, setCurrentMinute }) => {
  const [hoveredEvent, setHoveredEvent] = useState<MatchEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const totalMinutes = 120;

  // Filter events to show on timeline
  const timelineEvents = matchData.events.filter(
    (e) => e.type === 'goal' || e.type === 'var' || e.type === 'tactical_shift'
  );

  const handleMarkerHover = (e: React.MouseEvent, event: MatchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setHoverPosition({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 10
      });
    }
    setHoveredEvent(event);
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <span className="text-[10px] select-none">⚽</span>;
      case 'var':
        return <ShieldAlert size={10} className="text-gold" />;
      case 'tactical_shift':
        return <span className="text-[9px] font-bold text-neon-purple select-none">📋</span>;
      default:
        return <Info size={10} />;
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-white border-2 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'var':
        return 'bg-black border-2 border-gold shadow-[0_0_8px_rgba(255,209,44,0.6)]';
      case 'tactical_shift':
        return 'bg-black border-2 border-neon-purple shadow-[0_0_8px_rgba(157,78,221,0.6)]';
      default:
        return 'bg-slate-700 border border-white';
    }
  };

  return (
    <div className="glass-panel p-5 relative border-white/5 bg-slate-900/40 select-none">
      
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
          TIMELINE INTELLIGENCE SCRUBBER
        </h3>
        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">
          Drag slider or click markers to explore events
        </span>
      </div>

      {/* Interactive Timeline Track Area */}
      <div className="relative h-12 my-3 px-3 flex items-center">
        
        {/* Track wrapper for precise boundary alignment */}
        <div className="relative w-full h-full flex items-center">
          
          {/* Background Track Line */}
          <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full pointer-events-none" />

          {/* Filled Progress Highlight */}
          <div 
            className="absolute left-0 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full shadow-[0_0_8px_rgba(0,216,246,0.35)] pointer-events-none"
            style={{ width: `${(currentMinute / totalMinutes) * 100}%` }}
          />

          {/* Event Anchor Buttons */}
          {timelineEvents.map((event, index) => {
            const percentage = (event.minute / totalMinutes) * 100;
            const isActive = currentMinute >= event.minute;

            return (
              <button
                key={index}
                className={`absolute w-6 h-6 rounded-full flex items-center justify-center pointer-events-auto z-20 -translate-x-1/2 transition-all hover:scale-125 cursor-pointer ${getMarkerColor(event.type)} ${
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-90'
                }`}
                style={{ left: `${percentage}%` }}
                onMouseEnter={(e) => handleMarkerHover(e, event)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => setCurrentMinute(event.minute)}
              >
                {getMarkerIcon(event.type)}
              </button>
            );
          })}

          {/* Transparent Slider Input overlay for dragging */}
          <input
            type="range"
            min="0"
            max={totalMinutes}
            value={currentMinute}
            onChange={(e) => setCurrentMinute(Number(e.target.value))}
            className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer z-30"
          />

          {/* Custom thumb tracker visual */}
          <div 
            className="absolute w-5 h-5 bg-slate-950 rounded-full border-2 border-neon-cyan shadow-[0_0_10px_rgba(0,216,246,0.8)] pointer-events-none z-10 -translate-x-1/2 flex items-center justify-center"
            style={{ left: `${(currentMinute / totalMinutes) * 100}%` }}
          >
            <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
          </div>

          {/* Floating Hover Tooltip */}
          {hoveredEvent && (
            <div 
              className="absolute z-50 bg-slate-950/95 border border-white/10 rounded-xl p-2.5 shadow-2xl max-w-[200px] text-xs pointer-events-none -translate-x-1/2 -translate-y-full flex flex-col gap-1 transition-all duration-150 backdrop-blur-md"
              style={{ 
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y}px`
              }}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 mb-1 font-mono">
                <span className="font-black text-white">{hoveredEvent.minute}'</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                  hoveredEvent.type === 'goal' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  hoveredEvent.type === 'var' ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                }`}>
                  {hoveredEvent.type.replace('_', ' ')}
                </span>
              </div>
              <p className="font-bold text-gray-200 leading-tight">{hoveredEvent.title}</p>
              <p className="text-[9px] text-gray-400 font-medium leading-normal mt-0.5">{hoveredEvent.impactText}</p>
            </div>
          )}

        </div>
      </div>

      {/* Axis Scale Labels */}
      <div className="flex justify-between text-[9px] font-mono font-black text-gray-500 px-1 border-t border-white/5 pt-2.5 mt-2">
        <span>0' (KO)</span>
        <span>20'</span>
        <span>40'</span>
        <span>60'</span>
        <span>80'</span>
        <span>90' (FT)</span>
        <span>100'</span>
        <span>110'</span>
        <span>120' (ET)</span>
      </div>
    </div>
  );
};
