import React, { useRef, useState, useEffect } from 'react';
import { Target, AlertTriangle, ShieldAlert, Crosshair } from 'lucide-react';
import { matchData } from '../data/matchData';
import type { MatchEvent } from '../data/matchData';

interface TimelineProps {
  currentMinute: number;
  setCurrentMinute: React.Dispatch<React.SetStateAction<number>>;
}

export const Timeline: React.FC<TimelineProps> = ({ currentMinute, setCurrentMinute }) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert timeline percentage to match minute (0 to 120+)
  const updateMinuteFromMouse = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const minute = Math.round(percentage * 120);
    setCurrentMinute(minute);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateMinuteFromMouse(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateMinuteFromMouse(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getEventIcon = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return <Target size={14} className="text-white" />;
      case 'card':
        return <AlertTriangle size={14} className={event.description?.includes('Red') ? 'text-danger' : 'text-gold'} />;
      case 'var':
        return <ShieldAlert size={14} className="text-neon-purple" />;
      case 'substitution':
        return <Crosshair size={14} className="text-neon-cyan" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  const getEventColor = (team?: 'Argentina' | 'France' | 'Neutral') => {
    if (team === 'Argentina') return 'border-arg-blue bg-arg-blue/20';
    if (team === 'France') return 'border-fra-blue-light bg-fra-blue-light/20';
    return 'border-gray-500 bg-gray-500/20';
  };

  const currentProgress = (currentMinute / 120) * 100;

  return (
    <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl flex flex-col gap-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_var(--color-neon-cyan)] animate-pulse" />
          Timeline Intelligence Scrubber
        </h2>
        <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">
          DRAG SLIDER OR CLICK MARKERS TO EXPLORE EVENTS
        </span>
      </div>

      <div className="relative h-20 w-full select-none flex items-center">
        {/* Timeline Track Base */}
        <div 
          ref={timelineRef}
          className="absolute w-full h-3 bg-slate-950 rounded-full cursor-pointer shadow-inner border border-white/5"
          onMouseDown={handleMouseDown}
        >
          {/* Active Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-purple/50 to-neon-cyan/50 rounded-full transition-all duration-150 ease-linear shadow-[0_0_12px_rgba(0,216,246,0.3)]"
            style={{ width: `${Math.min(currentProgress, 100)}%` }}
          />
        </div>

        {/* Phase Dividers (HT, FT) */}
        <div className="absolute w-full top-1/2 -translate-y-1/2 pointer-events-none">
          {/* HT Line at 45m */}
          <div className="absolute h-8 w-[2px] bg-white/10 top-1/2 -translate-y-1/2" style={{ left: `${(45/120)*100}%` }}></div>
          {/* FT Line at 90m */}
          <div className="absolute h-8 w-[2px] bg-white/10 top-1/2 -translate-y-1/2" style={{ left: `${(90/120)*100}%` }}></div>
        </div>

        {/* Event Markers */}
        <div className="absolute w-full h-full pointer-events-none">
          {matchData.events.map((event, index) => {
            const leftPercent = (event.minute / 120) * 100;
            // Alternating top/bottom placement based on minute odd/even just to prevent overlap
            const isTop = event.minute % 2 === 0;

            return (
              <div
                key={index}
                className="absolute flex flex-col items-center pointer-events-auto cursor-pointer group"
                style={{ 
                  left: `calc(${leftPercent}% - 14px)`,
                  top: isTop ? '10px' : '38px',
                  zIndex: currentMinute >= event.minute ? 10 : 5
                }}
                onClick={() => setCurrentMinute(event.minute)}
              >
                {/* Connector Line */}
                <div className={`w-[1px] ${isTop ? 'h-3 mb-1' : 'h-3 mt-1 order-last'} bg-white/20 group-hover:bg-neon-cyan transition-colors`} />
                
                {/* Marker Icon */}
                <div 
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-md backdrop-blur-sm
                    ${getEventColor(event.team)} 
                    ${currentMinute >= event.minute ? 'opacity-100 scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'opacity-40 scale-90 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`
                  }
                  title={`${event.minute}': ${event.description}`}
                >
                  {getEventIcon(event)}
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/20 text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
                  style={{ top: isTop ? '-32px' : '32px' }}
                >
                  <span className="font-bold text-neon-cyan">{event.minute}'</span> - {event.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Time Scrubber Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-neon-cyan rounded-full cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(0,216,246,0.6)] transition-all pointer-events-none z-50"
          style={{ left: `calc(${Math.min(currentProgress, 100)}% - 10px)` }}
        />
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between px-2 text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mt-1">
        <span>0' (KO)</span>
        <span>45' (HT)</span>
        <span>90' (FT)</span>
        <span>120' (ET)</span>
      </div>
    </div>
  );
};
