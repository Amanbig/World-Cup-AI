export interface Source {
  section: string;
  page: string;
  source: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  incidentType?: string;
  loading?: boolean;
}

interface Props {
  message: Message;
}

const INCIDENT_BADGE: Record<string, string> = {
  var:      "📺 VAR",
  tactical: "🎯 Tactical",
  general:  "📖 Rule",
};

export default function ChatMessage({ message }: Props) {
  if (message.role === "user") {
    return (
      <div className="msg msg-user">
        {message.incidentType && (
          <span className="msg-badge">{INCIDENT_BADGE[message.incidentType]}</span>
        )}
        <p className="msg-text">{message.content}</p>
      </div>
    );
  }

  if (message.loading) {
    return (
      <div className="msg msg-assistant">
        <div className="msg-avatar">⚽</div>
        <div className="msg-bubble loading">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="msg msg-assistant">
      <div className="msg-avatar">⚽</div>
      <div className="msg-bubble">
        <p className="msg-text">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="msg-sources">
            <p className="sources-title">Sources cited</p>
            {message.sources.map((s, i) => (
              <div key={i} className="source-chip">
                <span className="source-section">{s.section || "General"}</span>
                <span className="source-page">p.{s.page}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
