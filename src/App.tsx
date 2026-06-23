import { useEffect, useRef, useState } from "react";
import ChatMessage from "./components/ChatMessage";
import IncidentSelector from "./components/IncidentSelector";
import MatchSidebar from "./components/MatchSidebar";
import PitchView from "./components/PitchView";
import type { Message, MatchInfo, MatchEvent, VizData } from "./types";
import "./App.css";

type IncidentType = "var" | "tactical" | "general";

const API = "http://localhost:8000";

const SUGGESTED: Record<IncidentType, string[]> = {
  var: [
    "Brazil's goal vs Argentina was ruled offside in the 71st minute. How does VAR check offside?",
    "A handball inside the box — why was it given as a penalty by VAR?",
    "The foul was outside the box but VAR upgraded it to a straight red card. Why?",
  ],
  tactical: [
    "England switched from 4-3-3 to 5-4-1 at half-time. What does that mean defensively?",
    "Why would a coach remove the holding midfielder when losing 1-0?",
    "What is a high press and when does it break down under fatigue?",
  ],
  general: [
    "What is the offside rule exactly? What body parts count?",
    "How much stoppage time can a referee add and why?",
    "When can a goalkeeper use their hands outside the penalty area?",
  ],
};

const DEFAULT_MATCH: MatchInfo = {
  home_team: null,
  away_team: null,
  minute: null,
  incident: "generic",
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

  // VAR sidebar state
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(DEFAULT_MATCH);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [vizData, setVizData] = useState<VizData | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/status`)
      .then((r) => r.json())
      .then((d) => { setKbReady(d.ready); setKbChunks(d.chunks ?? 0); })
      .catch(() => setKbReady(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function updateMatchInfo(partial: Partial<MatchInfo>) {
    setMatchInfo((prev) => ({ ...prev, ...partial }));
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = { id: makeId(), role: "user", content: text, incidentType };
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

      // Update sidebar if VAR mode returned match/viz data
      if (incidentType === "var") {
        if (data.match_info) {
          setMatchInfo((prev) => ({
            home_team: data.match_info.home_team ?? prev.home_team,
            away_team: data.match_info.away_team ?? prev.away_team,
            minute:    data.match_info.minute    ?? prev.minute,
            incident:  data.match_info.incident  ?? prev.incident,
          }));
        }
        if (data.viz_data) {
          setVizData(data.viz_data);
        }
        // Add event to timeline
        setMatchEvents((prev) => [
          ...prev,
          {
            id: makeId(),
            minute: data.match_info?.minute ?? null,
            type: "var",
            description: data.match_info?.incident
              ? `VAR: ${data.match_info.incident.charAt(0).toUpperCase() + data.match_info.incident.slice(1)}`
              : "VAR review",
          },
        ]);
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: makeId(),
          role: "assistant",
          content: data.answer ?? "No answer returned.",
          sources: data.sources ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: makeId(), role: "assistant", content: "Could not reach the backend. Is it running on port 8000?" },
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
            <p className="header-sub">AI World Cup Companion · Docling + Langflow</p>
          </div>
        </div>
        <div className="header-status">
          {kbReady === null && <span className="status-pill checking">Checking…</span>}
          {kbReady === true && (
            <span className="status-pill ready">{kbChunks.toLocaleString()} chunks ready</span>
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

      {/* ── Body ───────────────────────────────────────────────── */}
      {incidentType === "var" ? (
        /* VAR mode: 3-column — scoreboard | pitch | chat */
        <div className="var-layout">

          {/* Left: scoreboard + events */}
          <MatchSidebar
            matchInfo={matchInfo}
            events={matchEvents}
            onMatchInfoChange={updateMatchInfo}
          />

          {/* Center: pitch fills full height */}
          <div className="var-pitch-col">
            <PitchView
              vizData={vizData}
              homeTeam={matchInfo.home_team || "Home"}
              awayTeam={matchInfo.away_team || "Away"}
            />
          </div>

          {/* Right: chat */}
          <div className="chat-column">
            <main className="chat-area">
              {isEmpty ? (
                <div className="empty-state">
                  <p className="empty-headline">What do you want to understand?</p>
                  <p className="empty-sub">Pick a VAR incident to analyse</p>
                  <div className="suggestions">
                    {SUGGESTED.var.map((s) => (
                      <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <ChatMessage key={m.id} message={m} />)
              )}
              <div ref={bottomRef} />
            </main>
            <footer className="input-bar">
              <input
                className="input-field"
                placeholder="Describe the VAR incident, teams, and minute…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                disabled={loading}
              />
              <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                {loading ? "…" : "Send"}
              </button>
              <button className="upload-btn" title="Upload FIFA PDF" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "⏳" : "📄"}
              </button>
            </footer>
          </div>
        </div>
      ) : (
        /* Tactical / General: full-width chat */
        <div className="body-area">
          <div className="chat-column">
            <main className="chat-area">
              {isEmpty ? (
                <div className="empty-state">
                  <p className="empty-headline">What do you want to understand?</p>
                  <p className="empty-sub">Pick a question below or type your own</p>
                  <div className="suggestions">
                    {SUGGESTED[incidentType].map((s) => (
                      <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <ChatMessage key={m.id} message={m} />)
              )}
              <div ref={bottomRef} />
            </main>
            <footer className="input-bar">
              <input
                className="input-field"
                placeholder={incidentType === "tactical" ? "Ask about a formation, substitution, or pressing system…" : "Ask any FIFA rule question…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                disabled={loading}
              />
              <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                {loading ? "…" : "Send"}
              </button>
              <button className="upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "⏳" : "📄"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
