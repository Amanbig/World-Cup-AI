import { useEffect, useRef, useState } from "react";
import ChatMessage, { type Message, type Source } from "./components/ChatMessage";
import IncidentSelector from "./components/IncidentSelector";
import "./App.css";

type IncidentType = "var" | "tactical" | "general";

const API = "http://localhost:8000";

const SUGGESTED: Record<IncidentType, string[]> = {
  var: [
    "Brazil's goal was ruled offside by VAR. How does the offside line work?",
    "A player's arm was in an unnatural position — why was it a handball?",
    "The foul happened outside the box but VAR upgraded it to a red. Why?",
  ],
  tactical: [
    "England switched from 4-3-3 to 5-4-1 at half-time. What does that mean?",
    "Why would a coach remove a holding midfielder when losing?",
    "What is a high press and when does it break down?",
  ],
  general: [
    "What is the offside rule exactly?",
    "How much stoppage time can a referee add?",
    "When can a goalkeeper use their hands?",
  ],
};

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function App() {
  const [incidentType, setIncidentType] = useState<IncidentType>("var");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kbReady, setKbReady] = useState<boolean | null>(null);
  const [kbChunks, setKbChunks] = useState(0);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check knowledge base status on mount
  useEffect(() => {
    fetch(`${API}/api/status`)
      .then((r) => r.json())
      .then((d) => {
        setKbReady(d.ready);
        setKbChunks(d.chunks ?? 0);
      })
      .catch(() => setKbReady(false));
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text,
      incidentType,
    };
    const loadingMsg: Message = { id: makeId(), role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, incident_type: incidentType }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: data.answer ?? "Sorry, no answer was returned.",
        sources: (data.sources ?? []) as Source[],
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: makeId(), role: "assistant", content: "Could not reach the backend. Is it running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadPdf(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/api/ingest`, { method: "POST", body: form });
      const data = await res.json();
      setKbReady(true);
      setKbChunks(data.chunks ?? 0);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: `Knowledge base ready. Indexed ${data.chunks} chunks from "${data.filename}". Ask me anything!`,
        },
      ]);
    } catch {
      alert("Upload failed — check the backend logs.");
    } finally {
      setUploading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-ball">⚽</span>
          <div>
            <h1 className="header-title">MatchMind</h1>
            <p className="header-sub">AI World Cup Companion · Powered by Docling + Langflow</p>
          </div>
        </div>
        <div className="header-status">
          {kbReady === null && <span className="status-pill checking">Checking…</span>}
          {kbReady === true && (
            <span className="status-pill ready">
              {kbChunks.toLocaleString()} chunks ready
            </span>
          )}
          {kbReady === false && (
            <button
              className="status-pill upload-prompt"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Ingesting…" : "Upload FIFA PDF to start"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])}
          />
        </div>
      </header>

      {/* ── Mode selector ──────────────────────────────────────── */}
      <IncidentSelector selected={incidentType} onChange={setIncidentType} />

      {/* ── Chat area ──────────────────────────────────────────── */}
      <main className="chat-area">
        {isEmpty ? (
          <div className="empty-state">
            <p className="empty-headline">What do you want to understand?</p>
            <p className="empty-sub">Pick a question below or type your own</p>
            <div className="suggestions">
              {SUGGESTED[incidentType].map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </main>

      {/* ── Input ──────────────────────────────────────────────── */}
      <footer className="input-bar">
        <input
          className="input-field"
          placeholder={`Ask about a ${incidentType === "var" ? "VAR decision" : incidentType === "tactical" ? "tactical move" : "FIFA rule"}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? "…" : "Send"}
        </button>
        <button
          className="upload-btn"
          title="Upload a new FIFA PDF"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳" : "📄"}
        </button>
      </footer>
    </div>
  );
}
