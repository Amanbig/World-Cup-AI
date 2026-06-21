import React, { useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
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
    const timelineContainer = e.currentTarget.parentElement?.getBoundingClientRect();
    if (timelineContainer) {
      setHoverPosition({
        x: rect.left - timelineContainer.left + rect.width / 2,
        y: rect.top - timelineContainer.top - 8
      });
    }
    setHoveredEvent(event);
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <span className="text-[10px] leading-none">⚽</span>;
      case 'var':
        return <ShieldAlert size={10} className="text-[var(--gold)]" />;
      case 'tactical_shift':
        return <span className="text-[8px] font-bold text-[var(--neon-purple)]">🛡️</span>;
      default:
        return <AlertCircle size={10} />;
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-white border-2 border-green-500 shadow-[0_0_10px_rgba(57,255,20,0.5)]';
      case 'var':
        return 'bg-black border-2 border-[var(--gold)] shadow-[0_0_10px_rgba(255,209,44,0.5)]';
      case 'tactical_shift':
        return 'bg-black border-2 border-[var(--neon-purple)] shadow-[0_0_10px_rgba(157,78,221,0.5)]';
      default:
        return 'bg-gray-500 border-2 border-white';
    }
  };

  return (
    <div className="glass-panel p-5 relative border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black tracking-widest text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] animate-pulse"></span>
          Timeline Intelligence Scrubber
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          Drag slider or click events to analyze
        </span>
      </div>

      <div className="relative mt-8 mb-4 px-3 select-none">
        {/* Horizontal Line Bar */}
        <div className="absolute top-1/2 left-3 right-3 h-1.5 bg-gray-800 rounded-full transform -translate-y-1/2">
          {/* Progress filled bar */}
          <div 
            className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full shadow-[0_0_10px_rgba(0,216,246,0.3)]"
            style={{ width: `${(currentMinute / totalMinutes) * 100}%` }}
          />
        </div>

        {/* Interactive Slider Input overlay */}
        <input
          type="range"
          min="0"
          max={totalMinutes}
          value={currentMinute}
          onChange={(e) => setCurrentMinute(Number(e.target.value))}
          className="absolute top-1/2 left-3 right-3 w-[calc(100%-24px)] h-6 opacity-0 cursor-pointer z-20 transform -translate-y-1/2"
        />

        {/* Custom thumb tracker visual */}
        <div 
          className="absolute w-5 h-5 bg-white rounded-full border-2 border-[var(--neon-cyan)] shadow-[0_0_12px_rgba(0,216,246,0.8)] pointer-events-none z-10 transform -translate-x-1/2 -translate-y-1/2 top-1/2"
          style={{ left: `calc(12px + ${(currentMinute / totalMinutes) * (100)}% - ${currentMinute * 0.24}px)` }}
        >
          <div className="w-1.5 h-1.5 bg-[var(--neon-cyan)] rounded-full m-auto mt-[5px]" />
        </div>

        {/* Event Anchor Markers */}
        <div className="relative h-6 pointer-events-none">
          {timelineEvents.map((event, index) => {
            const percentage = (event.minute / totalMinutes) * 100;
            const leftOffset = `calc(12px + ${percentage}% - ${event.minute * 0.24}px)`;
            const isActive = currentMinute >= event.minute;

            return (
              <button
                key={index}
                className={`absolute w-6 h-6 rounded-full flex items-center justify-center pointer-events-auto z-10 transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-all hover:scale-125 ${getMarkerColor(event.type)} ${
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
                style={{ left: leftOffset }}
                onMouseEnter={(e) => handleMarkerHover(e, event)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => setCurrentMinute(event.minute)}
              >
                {getMarkerIcon(event.type)}
              </button>
            );
          })}
        </div>

        {/* Tooltip Popup */}
        {hoveredEvent && (
          <div 
            className="absolute z-30 bg-[#0F172A] border border-[rgba(255,255,255,0.15)] rounded-lg p-2.5 shadow-2xl max-w-[200px] text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col gap-1 transition-all duration-150"
            style={{ 
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-1 mb-1">
              <span className="font-bold text-white font-mono">{hoveredEvent.minute}'</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                hoveredEvent.type === 'goal' ? 'bg-green-900 text-green-300' : 
                hoveredEvent.type === 'var' ? 'bg-yellow-900 text-yellow-300' : 'bg-purple-900 text-purple-300'
              }`}>
                {hoveredEvent.type.replace('_', ' ')}
              </span>
            </div>
            <p className="font-semibold text-gray-200 leading-tight">{hoveredEvent.title}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">{hoveredEvent.impactText}</p>
          </div>
        )}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] px-1">
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
