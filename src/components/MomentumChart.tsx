import React, { useEffect, useRef } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { matchData } from '../data/matchData';

interface MomentumChartProps {
  currentMinute: number;
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ currentMinute }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Get active narrative
  const getActiveNarrative = (minute: number) => {
    let active = matchData.momentum[0];
    matchData.momentum.forEach((n) => {
      if (minute >= n.minute) {
        active = n;
      }
    });
    
    const intensity = Math.abs(active.value);
    const trend = active.value > 0 ? 'argentina' : active.value < 0 ? 'france' : 'neutral';
    
    return {
      minute: active.minute,
      trend,
      intensity,
      reason: active.explanation
    };
  };

  const activeNarrative = getActiveNarrative(currentMinute);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    
    // Clear previous drawings
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Grid Lines Configuration
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const numVerticalLines = 12; // One for every 10 mins (120 mins total)
    const numHorizontalLines = 4; // Midline + top/bottom

    // Draw horizontal grid lines
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = (height / numHorizontalLines) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", y.toString());
      line.setAttribute("x2", width.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", gridColor);
      line.setAttribute("stroke-width", i === numHorizontalLines / 2 ? "1.5" : "1"); // Thicker midline
      if (i === numHorizontalLines / 2) {
        line.setAttribute("stroke-dasharray", "4,4");
        line.setAttribute("stroke", "rgba(255,255,255,0.2)");
      }
      svg.appendChild(line);
    }

    // Draw vertical grid lines
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = (width / numVerticalLines) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x.toString());
      line.setAttribute("y1", "0");
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", height.toString());
      line.setAttribute("stroke", gridColor);
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    }

    // Draw Momentum Area Chart (Polygon + Path)
    let pathString = `M 0 ${height / 2}`; // Start at midline
    let polygonString = `0,${height/2}`;

    // Filter points up to current minute
    const visiblePoints = matchData.momentum.filter(p => p.minute <= currentMinute);

    if (visiblePoints.length > 0) {
      visiblePoints.forEach((point) => {
        const x = (point.minute / 120) * width;
        // value is between -100 and +100.
        // Map to Y: 100 -> 0 (top), -100 -> height (bottom), 0 -> height/2
        const normalizedY = ((100 - point.value) / 200) * height;
        
        pathString += ` L ${x} ${normalizedY}`;
        polygonString += ` ${x},${normalizedY}`;
      });

      // Close polygon path down to the midline
      const lastPoint = visiblePoints[visiblePoints.length - 1];
      const lastX = (lastPoint.minute / 120) * width;
      polygonString += ` ${lastX},${height / 2}`;
      
      // Defs for Gradients
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      
      const linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      linearGradient.setAttribute("id", "momentumGrad");
      linearGradient.setAttribute("x1", "0%");
      linearGradient.setAttribute("y1", "0%");
      linearGradient.setAttribute("x2", "0%");
      linearGradient.setAttribute("y2", "100%");
      
      // Top Color (Argentina)
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", "var(--color-arg-blue)");
      stop1.setAttribute("stop-opacity", "0.4");
      
      // Bottom Color (France)
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "var(--color-fra-blue-light)");
      stop2.setAttribute("stop-opacity", "0.4");
      
      linearGradient.appendChild(stop1);
      linearGradient.appendChild(stop2);
      defs.appendChild(linearGradient);
      svg.appendChild(defs);

      // Area fill
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", polygonString);
      polygon.setAttribute("fill", "url(#momentumGrad)");
      svg.appendChild(polygon);

      // Line outline
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathString);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "var(--color-neon-cyan)");
      path.setAttribute("stroke-width", "2.5");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      
      // Optional glow effect for line
      path.style.filter = "drop-shadow(0px 0px 4px var(--color-neon-cyan))";
      svg.appendChild(path);

      // Draw active playhead
      const playheadLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      playheadLine.setAttribute("x1", lastX.toString());
      playheadLine.setAttribute("y1", "0");
      playheadLine.setAttribute("x2", lastX.toString());
      playheadLine.setAttribute("y2", height.toString());
      playheadLine.setAttribute("stroke", "var(--color-neon-cyan)");
      playheadLine.setAttribute("stroke-width", "2");
      playheadLine.setAttribute("stroke-dasharray", "3,3");
      svg.appendChild(playheadLine);

      // Draw current point node
      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", lastX.toString());
      const lastY = ((100 - lastPoint.value) / 200) * height;
      node.setAttribute("cy", lastY.toString());
      node.setAttribute("r", "5");
      node.setAttribute("fill", "var(--color-neon-cyan)");
      node.setAttribute("stroke", "#fff");
      node.setAttribute("stroke-width", "2");
      node.style.filter = "drop-shadow(0px 0px 6px var(--color-neon-cyan))";
      svg.appendChild(node);
    }
  }, [currentMinute]);

  return (
    <div className="glass-panel p-6 border border-white/10 bg-slate-900/50 rounded-2xl flex flex-col gap-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <Activity size={20} className="text-neon-cyan" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Momentum Swing Analysis
          </h2>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-arg-blue"></span>
            <span className="text-gray-400">ARGENTINA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fra-blue-light"></span>
            <span className="text-gray-400">FRANCE</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[220px] relative mt-2 bg-slate-950/60 rounded-xl overflow-hidden border border-white/5 shadow-inner">
        {/* Y Axis Labels */}
        <span className="absolute top-2 left-3 text-[10px] font-mono text-arg-blue font-bold tracking-widest opacity-60 pointer-events-none">ARGENTINA DOMINATION</span>
        <span className="absolute bottom-2 left-3 text-[10px] font-mono text-fra-blue-light font-bold tracking-widest opacity-60 pointer-events-none">FRANCE DOMINATION</span>
        
        <svg
          ref={svgRef}
          className="w-full h-full"
        />
      </div>

      {/* AI Narrative Breakdown */}
      <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-5 rounded-2xl flex gap-4 items-start shadow-lg">
        <div className="flex flex-col gap-1 shrink-0 w-[100px]">
          <span className="text-[10px] font-black uppercase text-neon-cyan tracking-widest font-mono">
            Momentum
          </span>
          <span className={`text-2xl font-black font-digital glow-text-cyan ${
            activeNarrative.trend === 'argentina' ? 'text-arg-blue' :
            activeNarrative.trend === 'france' ? 'text-fra-blue-light' : 'text-gray-400'
          }`}>
            {activeNarrative.trend === 'argentina' ? '+' : activeNarrative.trend === 'france' ? '-' : ''}
            {activeNarrative.intensity}%
          </span>
        </div>
        
        <div className="flex flex-col gap-1.5 pl-4 border-l border-neon-cyan/20">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-neon-cyan" />
            <span className="text-xs font-black uppercase tracking-widest text-neon-cyan font-mono">
              Match Context • {activeNarrative.minute}'
            </span>
          </div>
          <p className="text-sm font-medium text-gray-200 leading-relaxed mt-0.5">
            {activeNarrative.reason}
          </p>
        </div>
      </div>
    </div>
  );
};
