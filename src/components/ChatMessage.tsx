import ReactMarkdown from 'react-markdown'
import type { Message } from '../types'

interface Props {
  message: Message
}

const INCIDENT_BADGE: Record<string, string> = {
  var:      "📺 VAR",
  tactical: "🎯 Tactical",
}

export default function ChatMessage({ message }: Props) {
  if (message.role === "user") {
    return (
      <div className="msg msg-user">
        {message.incidentType && (
          <span className="msg-badge">{INCIDENT_BADGE[message.incidentType]}</span>
        )}
        <p className="msg-text">{message.content}</p>
      </div>
    )
  }

  if (message.loading) {
    return (
      <div className="msg msg-assistant">
        <div className="msg-avatar">⚽</div>
        <div className="msg-bubble loading">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    )
  }

  if (message.toolStatus && !message.content) {
    return (
      <div className="msg msg-assistant">
        <div className="msg-avatar">⚽</div>
        <div className="msg-bubble tool-status-bubble">
          <span className="tool-status-text">{message.toolStatus}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="msg msg-assistant">
      <div className="msg-avatar">⚽</div>
      <div className={`msg-bubble${message.streaming ? " streaming" : ""}`}>
        <div className="msg-markdown">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
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
  )
}
