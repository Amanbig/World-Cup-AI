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
    ctx.fillStyle = '#1A2130';
    ctx.fillRect(0, 0, w, h);

    // Draw grid perspective lines representing soccer field
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i * 1.2 - 20, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw Goalpost for minute 108 (Goal Line Check)
    if (activeVar.id === 'var-108') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 30, 0);
      ctx.lineTo(w / 2 - 30, 45); // Left post
      ctx.lineTo(w / 2 + 30, 45); // Crossbar
      ctx.lineTo(w / 2 + 30, 0);  // Right post
      ctx.stroke();

      // Goal Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 43);
      ctx.lineTo(w, 43);
      ctx.stroke();
    }

    // Draw Player Outlines/Coordinates
    activeVar.visualData.outlines.forEach((p) => {
      const playerX = (p.x / 100) * w;
      const playerY = (p.y / 100) * h;

      // Draw bounding box or circle for player
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent fill
      ctx.fillStyle = `${p.color}20`;
      ctx.fill();

      // Draw tag label
      ctx.fillStyle = '#000000';
      ctx.fillRect(playerX - 35, playerY + 18, 70, 14);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(playerX - 35, playerY + 18, 70, 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, playerX, playerY + 28);

      // Label isOffside marker
      if (p.isOffside !== undefined) {
        ctx.fillStyle = p.isOffside ? '#FF3860' : '#39FF14';
        ctx.beginPath();
        ctx.arc(playerX, playerY - 20, 4, 0, Math.PI * 2);
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
        ctx.lineWidth = 2;
        ctx.setLineDash(activeVar.id === 'var-108' ? [] : [4, 4]); // solid for offside lines, dashed for others
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Write Overlay Info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 120, 20);
    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 9px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText('VAR CAMERA FEED', 10, 18);

  }, [activeVar]);

  if (!activeVar) {
    return (
      <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] h-full flex flex-col justify-center items-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 mb-3 border border-gray-700">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-sm font-bold text-gray-300">VAR Decision Center</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1">
          No VAR checks have occurred up to {currentMinute}'. The first review happens at the 21st minute.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--gold)]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            VAR Decision Center
          </h2>
        </div>
        
        {/* Toggle between decisions if multiple are available */}
        {availableDecisions.length > 1 && (
          <div className="flex gap-1 overflow-x-auto max-w-[150px] scrollbar-none">
            {availableDecisions.map((dec) => (
              <button
                key={dec.id}
                onClick={() => setSelectedVarId(dec.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  activeVar.id === dec.id
                    ? 'bg-[var(--gold)] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {dec.minute}'
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Canvas Freeze Frame */}
        <div className="flex flex-col gap-2">
          <div className="border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-lg relative bg-[#1A2130]">
            <canvas
              ref={canvasRef}
              width={320}
              height={200}
              className="w-full h-auto block"
            />
            {/* Legend Tag */}
            <div className="absolute bottom-2 right-2 bg-black/80 border border-white/10 px-2 py-1 rounded text-[8px] font-mono flex gap-2">
              <span className="text-[var(--neon-cyan)]">■ ARG</span>
              <span className="text-[var(--danger)]">■ FRA</span>
              <span className="text-[var(--gold)]">■ VAR</span>
            </div>
          </div>
          <span className="text-[10px] text-center font-mono text-[var(--text-muted)]">
            {activeVar.visualData.freezeFrameTitle}
          </span>
        </div>

        {/* Info detail and Rulebook */}
        <div className="flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-[var(--gold)] tracking-widest">
                  Referee Review • {activeVar.minute}'
                </span>
                <h3 className="text-xs font-black text-white uppercase mt-0.5">
                  {activeVar.originalCall}
                </h3>
              </div>
              <div className="px-2 py-0.5 rounded bg-[rgba(57,255,20,0.12)] border border-[rgba(57,255,20,0.3)] text-[8px] font-mono font-black text-[var(--neon-green)] shrink-0">
                {activeVar.decision}
              </div>
            </div>
            
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed bg-[rgba(11,15,25,0.3)] p-3 border border-[rgba(255,255,255,0.05)] rounded-lg">
              {activeVar.evidenceText}
            </p>
          </div>

          {/* FIFA Law Citation */}
          <div className="bg-[rgba(255,209,44,0.03)] border border-[rgba(255,209,44,0.12)] p-3 rounded-lg flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-[var(--gold)] uppercase tracking-wider flex items-center gap-1">
              <Scale size={10} />
              FIFA Rulebook Reference (Law DB)
            </span>
            <div>
              <span className="text-[10px] font-bold text-white block">{activeVar.ruleApplied}</span>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5 italic">
                "{activeVar.ruleDescription}"
              </p>
            </div>
          </div>

          {/* Confidence Slider Indicator */}
          <div className="flex items-center justify-between border-t border-gray-800 pt-2 text-[10px]">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Info size={10} />
              VAR Confidence Level
            </span>
            <span className="font-mono font-black text-[var(--gold)]">
              {activeVar.confidence}% Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
