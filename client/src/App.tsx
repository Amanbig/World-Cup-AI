import { useEffect, useRef, useState } from "react";
import ChatMessage from "./components/ChatMessage";
import PitchView from "./components/PitchView";
import type { Message, MatchInfo, VizData, MatchEventDef } from "./types";
import { HISTORICAL_MATCHES, YEARS, type HistoricalMatch } from "./data/matches";
import "./App.css";

// incident_type is now just a hint to the backend — the LLM decides what tools to call
type IncidentType = "var" | "tactical" | "general";

const API = import.meta.env.VITE_API_URL ?? "";

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽", card: "🟨", var: "📺", sub: "🔄",
  corner: "🚩", freekick: "🎯", penalty: "⚡",
};


function makeId() { return Math.random().toString(36).slice(2); }

const DEFAULT_MATCH_INFO: MatchInfo = { home_team: null, away_team: null, minute: null, incident: "generic" };

export default function App() {
  const [selectedMatch, setSelectedMatch] = useState<HistoricalMatch | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kbReady, setKbReady] = useState<boolean | null>(null);
  const [kbChunks, setKbChunks] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(DEFAULT_MATCH_INFO);
  const [vizData, setVizData] = useState<VizData | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/status`)
      .then(r => r.json())
      .then(d => { setKbReady(d.ready); setKbChunks(d.chunks ?? 0); })
      .catch(() => setKbReady(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleMatchSelect(match: HistoricalMatch | null) {
    setSelectedMatch(match);
    setDropOpen(false);
    setVizData(null);
    setActiveEventId(null);
    setMatchInfo(match
      ? { home_team: match.home, away_team: match.away, minute: 90, incident: "generic" }
      : DEFAULT_MATCH_INFO
    );
  }

  async function sendMessage(text: string, forceType?: IncidentType) {
    if (!text.trim() || loading) return;
    setInput("");

    // forceType is a hint for event chips; the LLM decides the real tool calls
    const incidentType: IncidentType = forceType ?? "general";
    const userMsg: Message = { id: makeId(), role: "user", content: text, incidentType };
    const assistantId = makeId();
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", loading: true }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, incident_type: incidentType }),
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", accumulated = "";
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, loading: false, streaming: true } : m));

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
            if (evt.type === "tool_status") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolStatus: evt.label } : m
              ));
            } else if (evt.type === "chunk") {
              accumulated += evt.text;
              const snap = accumulated;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snap, toolStatus: undefined } : m));
            } else if (evt.type === "done") {
              // LLM decides when to create animations — show whenever viz_data is present
              if (evt.viz_data) setVizData(evt.viz_data);
              if (evt.match_info) {
                setMatchInfo(prev => ({
                  home_team: evt.match_info.home_team ?? prev.home_team,
                  away_team: evt.match_info.away_team ?? prev.away_team,
                  minute:    evt.match_info.minute    ?? prev.minute,
                  incident:  evt.match_info.incident  ?? prev.incident,
                }));
              }
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated, sources: evt.sources ?? [], streaming: false } : m
              ));
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reach the backend.";
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, loading: false, streaming: false, content: msg } : m));
    } finally {
      setLoading(false);
    }
  }

  function handleEventClick(ev: MatchEventDef) {
    setActiveEventId(ev.id);
    sendMessage(ev.prompt, "var");
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
      setMessages(prev => [...prev, { id: makeId(), role: "assistant", content: `Knowledge base ready — ${data.chunks} chunks indexed from "${data.filename}".` }]);
    } catch {
      alert("Upload failed — check the backend logs.");
    } finally {
      setUploading(false);
    }
  }

  const isEmpty = messages.length === 0;
  const homeTeam = matchInfo.home_team || selectedMatch?.home || "Home";
  const awayTeam = matchInfo.away_team || selectedMatch?.away || "Away";

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-ball">⚽</span>
          <div>
            <h1 className="header-title">MatchMind</h1>
            <p className="header-sub">AI World Cup Companion</p>
          </div>
        </div>
        <div className="header-status">
          {kbReady === null && <span className="status-pill checking">Checking…</span>}
          {kbReady === true && <span className="status-pill ready">{kbChunks.toLocaleString()} chunks ready</span>}
          {kbReady === false && (
            <button className="status-pill upload-prompt" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Ingesting…" : "Upload FIFA PDF"}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => e.target.files?.[0] && uploadPdf(e.target.files[0])} />
        </div>
      </header>

      <div className="app-body">
        {/* ── LEFT: pitch panel ── */}
        <div className="left-col">
          {/* Match selector */}
          <div className="match-bar" ref={dropRef}>
            <button
              className={`match-bar-btn${dropOpen ? " open" : ""}${selectedMatch ? " active" : ""}`}
              onClick={() => setDropOpen(v => !v)}
            >
              <span>🏟️</span>
              <span className="mbb-label">
                {selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away} · ${selectedMatch.year}` : "Select a match"}
              </span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transition: "transform .2s", transform: dropOpen ? "rotate(180deg)" : "none" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="match-dropdown left-dropdown">
                <button className={`md-item md-live${!selectedMatch ? " active" : ""}`} onClick={() => handleMatchSelect(null)}>
                  <span className="md-dot live" />
                  <span>Live / Custom Match</span>
                  <span className="md-live-badge">LIVE</span>
                </button>
                <div className="md-divider" />
                {YEARS.map(year => (
                  <div key={year}>
                    <p className="md-year">{year} FIFA World Cup</p>
                    {HISTORICAL_MATCHES.filter(m => m.year === year).map(m => (
                      <button key={m.id} className={`md-item${selectedMatch?.id === m.id ? " active" : ""}`}
                        onClick={() => handleMatchSelect(m)}>
                        <span className="md-stage">{m.stage}</span>
                        <span className="md-teams">{m.home} <span className="md-score">{m.homeScore}–{m.awayScore}</span> {m.away}</span>
                        {m.note && <span className="md-note">{m.note}</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini scoreboard */}
          {selectedMatch && (
            <div className="mini-score">
              <div className="mini-score-team home">{selectedMatch.home}</div>
              <div className="mini-score-center">
                <div className="mini-score-num">
                  <span>{selectedMatch.homeScore}</span>
                  <span className="mini-score-dash">–</span>
                  <span>{selectedMatch.awayScore}</span>
                </div>
                {selectedMatch.note && <div className="mini-score-note">{selectedMatch.note}</div>}
                <div className="mini-score-meta">{selectedMatch.year} · {selectedMatch.stage}</div>
              </div>
              <div className="mini-score-team away">{selectedMatch.away}</div>
            </div>
          )}

          {/* Pitch */}
          <div className="pitch-container">
            <PitchView vizData={vizData} homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>
        </div>

        {/* ── RIGHT: event timeline + chat ── */}
        <div className="right-col">
          {/* Event timeline strip */}
          {selectedMatch && selectedMatch.events.length > 0 && (
            <div className="event-timeline">
              <span className="tl-label">Events</span>
              <div className="tl-chips">
                {selectedMatch.events.map(ev => (
                  <button
                    key={ev.id}
                    className={`ev-chip ev-${ev.type}${activeEventId === ev.id ? " active" : ""}`}
                    onClick={() => handleEventClick(ev)}
                    title={ev.prompt.slice(0, 120)}
                    disabled={loading}
                  >
                    <span className="ev-icon">{EVENT_ICONS[ev.type] ?? "ℹ️"}</span>
                    <span className="ev-min">{ev.minute}'</span>
                    <span className="ev-desc">{ev.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat area */}
          <main className="chat-area">
            {isEmpty ? (
              <div className="empty-state">
                {selectedMatch ? (
                  <>
                    <div className="empty-match-badge">
                      <span className="empty-match-year">{selectedMatch.year} · {selectedMatch.stage}</span>
                    </div>
                    <p className="empty-headline">{selectedMatch.home} vs {selectedMatch.away}</p>
                    <p className="empty-sub">
                      {selectedMatch.homeScore}–{selectedMatch.awayScore}
                      {selectedMatch.note ? ` · ${selectedMatch.note}` : ""}
                      {" · "}Click an event above or ask a question
                    </p>
                    <div className="suggestions">
                      {selectedMatch.queries.map(s => (
                        <button key={s} className="suggestion-chip" onClick={() => sendMessage(s, "var")} disabled={loading}>{s}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="empty-headline">Welcome to MatchMind</p>
                    <p className="empty-sub">Select a match to explore events with visualizations, or ask any football question</p>
                    <div className="suggestions">
                      <button className="suggestion-chip" onClick={() => sendMessage("Show me how a corner kick set piece is organized in a 4-3-3 formation", "var")} disabled={loading}>
                        Show me a corner kick set piece in a 4-3-3
                      </button>
                      <button className="suggestion-chip" onClick={() => sendMessage("Explain how VAR reviews an offside goal — show player positions", "var")} disabled={loading}>
                        How does VAR review an offside goal?
                      </button>
                      <button className="suggestion-chip" onClick={() => sendMessage("What is the offside rule? Which body parts count?")} disabled={loading}>
                        What is the offside rule?
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              messages.map(m => <ChatMessage key={m.id} message={m} />)
            )}
            <div ref={bottomRef} />
          </main>

          {/* Input bar */}
          <footer className="input-bar">
            <div className="input-bar-inner">
              <input
                className="input-field"
                placeholder={selectedMatch ? `Ask about ${selectedMatch.home} vs ${selectedMatch.away}…` : "Ask about VAR, tactics, or any FIFA rule…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
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
    </div>
  );
}
