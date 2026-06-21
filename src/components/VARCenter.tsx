import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Scale, Info } from 'lucide-react';
import { matchData } from '../data/matchData';
import type { VARDecision } from '../data/matchData';

interface VARCenterProps {
  currentMinute: number;
}

export const VARCenter: React.FC<VARCenterProps> = ({ currentMinute }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);

  // Get list of all VAR events that occurred before/at the current minute
  const availableDecisions = matchData.varDecisions.filter(
    (d) => d.minute <= currentMinute
  );

  // Get active decision (either selected or the most recent one)
  const getActiveDecision = (): VARDecision | null => {
    if (availableDecisions.length === 0) return null;
    if (selectedVarId) {
      const selected = availableDecisions.find((d) => d.id === selectedVarId);
      if (selected) return selected;
    }
    // Default to the most recent one
    return availableDecisions[availableDecisions.length - 1];
  };

  const activeVar = getActiveDecision();

  // Reset selected ID if the active state becomes invalid
  useEffect(() => {
    if (activeVar && !availableDecisions.find((d) => d.id === activeVar.id)) {
      setSelectedVarId(null);
    }
  }, [currentMinute, availableDecisions, activeVar]);

  // Draw the Canvas Freeze Frame
  useEffect(() => {
    if (!activeVar || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, w, h);

    // Draw field background (simulating camera frame)
    ctx.fillStyle = '#0f172a'; // slate-900 background matching theme
    ctx.fillRect(0, 0, w, h);

    // Draw grid perspective lines representing soccer field
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i * 1.2 - 20, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw Goalpost for minute 108 (Goal Line Check)
    if (activeVar.id === 'var-108') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 45, 0);
      ctx.lineTo(w / 2 - 45, 60); // Left post
      ctx.lineTo(w / 2 + 45, 60); // Crossbar
      ctx.lineTo(w / 2 + 45, 0);  // Right post
      ctx.stroke();

      // Goal Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 58);
      ctx.lineTo(w, 58);
      ctx.stroke();
    }

    // Draw Player Outlines/Coordinates
    activeVar.visualData.outlines.forEach((p) => {
      const playerX = (p.x / 100) * w;
      const playerY = (p.y / 100) * h;

      // Draw bounding box or circle for player
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent fill
      ctx.fillStyle = `${p.color}20`;
      ctx.fill();

      // Draw tag label
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(playerX - 40, playerY + 18, 80, 16);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(playerX - 40, playerY + 18, 80, 16);

      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, playerX, playerY + 29);

      // Label isOffside marker
      if (p.isOffside !== undefined) {
        ctx.fillStyle = p.isOffside ? '#FF3860' : '#39FF14';
        ctx.beginPath();
        ctx.arc(playerX, playerY - 22, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw VAR calibrated lines (Offside / Foul lines)
    if (activeVar.visualData.varLines) {
      activeVar.visualData.varLines.coords.forEach((line) => {
        const x1 = (line.x1 / 100) * w;
        const y1 = (line.y1 / 100) * h;
        const x2 = (line.x2 / 100) * w;
        const y2 = (line.y2 / 100) * h;

        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2.5;
        ctx.setLineDash(activeVar.id === 'var-108' ? [] : [5, 5]); // solid for offside lines, dashed for others
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Write Overlay Info
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(8, 8, 140, 24);
    ctx.fillStyle = '#00D8F6';
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VAR CAMERA FEED', 16, 24);

  }, [activeVar]);

  if (!activeVar) {
    return (
      <div className="glass-panel p-6 border-white/5 bg-slate-900/40 min-h-[320px] rounded-2xl flex flex-col justify-center items-center text-center shadow-lg backdrop-blur-xl">
        <div className="w-14 h-14 rounded-full bg-slate-950/60 border border-white/5 flex items-center justify-center text-gray-500 mb-4 shadow-inner">
          <ShieldCheck size={24} className="text-gray-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">VAR Decision Center</h3>
        <p className="text-xs text-gray-500 font-medium max-w-sm mt-2 leading-relaxed">
          No VAR checks have occurred up to {currentMinute}'. The first review occurs at the 21st minute.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border-white/10 bg-slate-900/50 flex flex-col gap-6 rounded-2xl shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="text-gold" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            VAR Decision Center
          </h2>
        </div>
        
        {/* Toggle between decisions if multiple are available */}
        {availableDecisions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto max-w-[200px] custom-scrollbar pb-1">
            {availableDecisions.map((dec) => (
              <button
                key={dec.id}
                onClick={() => setSelectedVarId(dec.id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                  activeVar.id === dec.id
                    ? 'bg-gold/20 border-gold text-gold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                {dec.minute}'
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Canvas Freeze Frame */}
        <div className="flex flex-col gap-3">
          <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative bg-slate-950">
            <canvas
              ref={canvasRef}
              width={400}
              height={220}
              className="w-full h-auto block"
            />
            {/* Legend Tag */}
            <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex gap-3 shadow-lg">
              <span className="text-arg-blue">■ ARG</span>
              <span className="text-danger">■ FRA</span>
              <span className="text-gold">■ VAR</span>
            </div>
          </div>
          <span className="text-xs text-center font-mono font-bold text-gray-400 uppercase tracking-wider mt-1">
            {activeVar.visualData.freezeFrameTitle}
          </span>
        </div>

        {/* Info detail and Rulebook */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gold tracking-widest mb-1">
                  Referee Review • {activeVar.minute}'
                </span>
                <h3 className="text-sm font-bold text-white uppercase">
                  {activeVar.originalCall}
                </h3>
              </div>
              <div className="px-3 py-1 rounded-md bg-neon-green/10 border border-neon-green/30 text-xs font-mono font-bold text-neon-green uppercase shrink-0 shadow-sm">
                {activeVar.decision}
              </div>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed bg-slate-950/40 p-4 border border-white/5 rounded-xl font-medium mt-1">
              {activeVar.evidenceText}
            </p>
          </div>

          {/* FIFA Law Citation */}
          <div className="bg-gold/5 border border-gold/15 p-4 rounded-xl flex flex-col gap-2 shadow-inner">
            <span className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-2 border-b border-gold/10 pb-2 mb-1">
              <Scale size={14} />
              FIFA Rulebook Reference (Law DB)
            </span>
            <div>
              <span className="text-xs font-bold text-white block mb-1">{activeVar.ruleApplied}</span>
              <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
                "{activeVar.ruleDescription}"
              </p>
            </div>
          </div>

          {/* Confidence Slider Indicator */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono font-black mt-2">
            <span className="text-gray-500 flex items-center gap-2 tracking-wider">
              <Info size={14} />
              VAR VERIFIED LOG
            </span>
            <span className="text-gold text-sm drop-shadow-[0_0_8px_rgba(255,209,44,0.4)]">
              {activeVar.confidence}% Confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
