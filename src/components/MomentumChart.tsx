import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { matchData } from '../data/matchData';

interface MomentumChartProps {
  currentMinute: number;
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ currentMinute }) => {
  const momentumData = matchData.momentum;
  const width = 600;
  const height = 160;
  const padding = 15;

  // Map data to SVG coordinates
  const getCoordinates = () => {
    return momentumData.map((d) => {
      const x = padding + (d.minute / 120) * (width - 2 * padding);
      // value is from -100 to 100. Let's map it so +100 is top, -100 is bottom.
      const y = height / 2 - (d.value / 100) * (height / 2 - padding);
      return { x, y, ...d };
    });
  };

  const coords = getCoordinates();

  // Create path for the momentum line
  const linePath = coords.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // Create fill path for Argentina (above midline)
  const argFillPath = () => {
    const midY = height / 2;
    let path = `M ${coords[0].x} ${midY}`;
    coords.forEach((p) => {
      const yVal = p.y < midY ? p.y : midY; // only take points above middle line
      path += ` L ${p.x} ${yVal}`;
    });
    path += ` L ${coords[coords.length - 1].x} ${midY} Z`;
    return path;
  };

  // Create fill path for France (below midline)
  const fraFillPath = () => {
    const midY = height / 2;
    let path = `M ${coords[0].x} ${midY}`;
    coords.forEach((p) => {
      const yVal = p.y > midY ? p.y : midY; // only take points below middle line
      path += ` L ${p.x} ${yVal}`;
    });
    path += ` L ${coords[coords.length - 1].x} ${midY} Z`;
    return path;
  };

  // Get current active explanation
  const getCurrentExplanation = () => {
    let active = momentumData[0];
    momentumData.forEach((d) => {
      if (d.minute <= currentMinute) {
        active = d;
      }
    });
    return active;
  };

  const currentMom = getCurrentExplanation();

  // Calculate current indicator X coordinate
  const indicatorX = padding + (currentMinute / 120) * (width - 2 * padding);

  return (
    <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--neon-cyan)] animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Momentum Swing Analysis
          </h2>
        </div>
        <div className="flex gap-4 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-[var(--arg-blue)]">
            <span className="w-2 h-2 rounded bg-[var(--arg-blue)]"></span> ARG
          </span>
          <span className="flex items-center gap-1 text-[var(--fra-blue-light)]">
            <span className="w-2 h-2 rounded bg-[var(--fra-blue-light)]"></span> FRA
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full bg-[rgba(11,15,25,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-2 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Gradients */}
            <linearGradient id="argGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--arg-blue)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--arg-blue)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fraGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--fra-blue-light)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--fra-blue-light)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(116, 172, 223, 0.05)" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(42, 82, 190, 0.05)" strokeWidth="1" />

          {/* Area Fills */}
          <path d={argFillPath()} fill="url(#argGrad)" />
          <path d={fraFillPath()} fill="url(#fraGrad)" />

          {/* Polyline */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-[var(--neon-cyan)] shadow-md"
            style={{
              stroke: 'url(#lineGrad)',
            }}
          />
          {/* Custom line gradient */}
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="50%" stopColor="var(--neon-purple)" />
            <stop offset="100%" stopColor="var(--neon-cyan)" />
          </linearGradient>

          {/* Vertical Time Tracker Bar */}
          <line
            x1={indicatorX}
            y1={5}
            x2={indicatorX}
            y2={height - 5}
            stroke="var(--neon-cyan)"
            strokeWidth="1.5"
            strokeDasharray="2"
            className="shadow-lg"
          />

          {/* Current tracker dot intersection */}
          {(() => {
            const currentY = height / 2 - (currentMom.value / 100) * (height / 2 - padding);
            return (
              <circle
                cx={indicatorX}
                cy={currentY}
                r="5"
                fill="var(--neon-cyan)"
                stroke="#fff"
                strokeWidth="1.5"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* Labels overlay */}
        <div className="absolute top-4 left-4 text-[9px] font-mono text-[var(--text-muted)]">ARGENTINA PRESSING</div>
        <div className="absolute bottom-4 left-4 text-[9px] font-mono text-[var(--text-muted)]">FRANCE PRESSING</div>
      </div>

      {/* Narrative Card */}
      <div className="bg-[rgba(11,15,25,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex gap-4 items-start">
        <div className="p-3 bg-[rgba(0,216,246,0.1)] border border-[rgba(0,216,246,0.2)] rounded-xl text-[var(--neon-cyan)] font-mono flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-gray-400">VAL</span>
          <span className="text-xl font-black">{currentMom.value > 0 ? `+${currentMom.value}` : currentMom.value}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-[var(--neon-cyan)] tracking-widest flex items-center gap-1">
            <TrendingUp size={12} />
            Momentum Narrative • {currentMom.minute}'
          </span>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            {currentMom.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};
