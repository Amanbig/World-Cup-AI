import { useEffect, useRef, useState } from "react";
import ChatMessage from "./components/ChatMessage";
import IncidentSelector from "./components/IncidentSelector";
import MatchSidebar from "./components/MatchSidebar";
import PitchView from "./components/PitchView";
import type { Message, MatchInfo, MatchEvent, VizData } from "./types";
import type { HistoricalMatch } from "./data/matches";
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
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

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

  function handleMatchSelect(match: HistoricalMatch | null) {
    setSelectedMatchId(match?.id ?? null);
    setVizData(null);
    setMatchEvents([]);
    if (match) {
      setMatchInfo({
        home_team: match.home,
        away_team: match.away,
        minute: 90,
        incident: "generic",
      });
    } else {
      setMatchInfo(DEFAULT_MATCH);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = { id: makeId(), role: "user", content: text, incidentType };
    const assistantId = makeId();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", loading: true }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, incident_type: incidentType }),
      });

      if (!res.ok || !res.body) throw new Error("Stream error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulated = "";

      // Switch loading → streaming so text starts appearing with cursor
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, loading: false, streaming: true } : m));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "chunk") {
              accumulated += evt.text;
              const snap = accumulated;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: snap } : m));
            } else if (evt.type === "done") {
              if (incidentType === "var") {
                if (evt.match_info) {
                  setMatchInfo((prev) => ({
                    home_team: evt.match_info.home_team ?? prev.home_team,
                    away_team: evt.match_info.away_team ?? prev.away_team,
                    minute:    evt.match_info.minute    ?? prev.minute,
                    incident:  evt.match_info.incident  ?? prev.incident,
                  }));
                }
                if (evt.viz_data) setVizData(evt.viz_data);
                setMatchEvents((prev) => [...prev, {
                  id: makeId(),
                  minute: evt.match_info?.minute ?? null,
                  type: "var",
                  description: evt.match_info?.incident
                    ? `VAR: ${evt.match_info.incident.charAt(0).toUpperCase() + evt.match_info.incident.slice(1)}`
                    : "VAR review",
                }]);
              }
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, content: accumulated, sources: evt.sources ?? [], streaming: false } : m
              ));
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId
          ? { ...m, loading: false, content: "Could not reach the backend. Is it running on port 8000?" }
          : m
      ));
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
      <IncidentSelector
        selected={incidentType}
        onChange={setIncidentType}
        onMatchSelect={handleMatchSelect}
        selectedMatchId={selectedMatchId}
      />

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
              <div className="input-bar-inner">
                <input
                  className="input-field"
                  placeholder="Describe the VAR incident, teams, and minute…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  disabled={loading}
                />
                <button className="upload-btn" title="Upload FIFA PDF" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  }
                </button>
                <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                  {loading
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  }
                </button>
              </div>
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
              <div className="input-bar-inner">
                <input
                  className="input-field"
                  placeholder={incidentType === "tactical" ? "Ask about a formation, substitution, or pressing system…" : "Ask any FIFA rule question…"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  disabled={loading}
                />
                <button className="upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  }
                </button>
                <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                  {loading
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  }
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
