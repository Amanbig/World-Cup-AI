import { useState, useRef, useEffect } from "react";
import { HISTORICAL_MATCHES, YEARS, type HistoricalMatch } from "../data/matches";

type IncidentType = "var" | "tactical" | "general";

interface Props {
  selected: IncidentType;
  onChange: (type: IncidentType) => void;
  onMatchSelect: (match: HistoricalMatch | null) => void;
  selectedMatchId: string | null;
}

const TYPES: { id: IncidentType; label: string; icon: string; desc: string }[] = [
  { id: "var",      label: "VAR Decision",      icon: "📺", desc: "Explain an offside, handball or foul review" },
  { id: "tactical", label: "Tactical Analysis", icon: "🎯", desc: "Break down formations, subs & pressing traps" },
  { id: "general",  label: "Rule Question",      icon: "📖", desc: "Understand any FIFA Law of the Game" },
];

export default function IncidentSelector({ selected, onChange, onMatchSelect, selectedMatchId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeMatch = selectedMatchId
    ? HISTORICAL_MATCHES.find(m => m.id === selectedMatchId) ?? null
    : null;

  return (
    <div className="incident-selector">
      {TYPES.map((t) => (
        <button
          key={t.id}
          className={`incident-btn${selected === t.id ? " active" : ""}`}
          onClick={() => onChange(t.id)}
          title={t.desc}
        >
          <span className="incident-icon">{t.icon}</span>
          <span className="incident-label">{t.label}</span>
        </button>
      ))}

      {/* Match selector — right side */}
      <div className="match-selector" ref={ref}>
        <button
          className={`match-sel-btn${open ? " open" : ""}${activeMatch ? " has-match" : ""}`}
          onClick={() => setOpen(v => !v)}
        >
          <span className="match-sel-icon">🏟️</span>
          <span className="match-sel-label">
            {activeMatch
              ? `${activeMatch.home} vs ${activeMatch.away} · ${activeMatch.year}`
              : "Live Match"}
          </span>
          <svg className="match-sel-caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div className="match-dropdown">
            {/* Live option */}
            <button
              className={`md-item md-live${!activeMatch ? " active" : ""}`}
              onClick={() => { onMatchSelect(null); setOpen(false); }}
            >
              <span className="md-dot live" />
              <span>Live Match</span>
              <span className="md-live-badge">LIVE</span>
            </button>

            <div className="md-divider" />

            {YEARS.map(year => (
              <div key={year}>
                <p className="md-year">{year} FIFA World Cup</p>
                {HISTORICAL_MATCHES.filter(m => m.year === year).map(m => (
                  <button
                    key={m.id}
                    className={`md-item${activeMatch?.id === m.id ? " active" : ""}`}
                    onClick={() => { onMatchSelect(m); setOpen(false); }}
                  >
                    <span className="md-stage">{m.stage}</span>
                    <span className="md-teams">
                      {m.home}
                      <span className="md-score">{m.homeScore}–{m.awayScore}</span>
                      {m.away}
                    </span>
                    {m.note && <span className="md-note">{m.note}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
