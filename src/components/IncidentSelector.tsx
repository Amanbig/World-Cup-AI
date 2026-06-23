type IncidentType = "var" | "tactical" | "general";

interface Props {
  selected: IncidentType;
  onChange: (type: IncidentType) => void;
}

const TYPES: { id: IncidentType; label: string; icon: string; desc: string }[] = [
  { id: "var",      label: "VAR Decision",       icon: "📺", desc: "Explain an offside, handball or foul review" },
  { id: "tactical", label: "Tactical Analysis",  icon: "🎯", desc: "Break down formations, subs & pressing traps" },
  { id: "general",  label: "Rule Question",       icon: "📖", desc: "Understand any FIFA Law of the Game" },
];

export default function IncidentSelector({ selected, onChange }: Props) {
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
    </div>
  );
}
