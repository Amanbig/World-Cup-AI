import { useEffect, useState } from 'react';
import { Globe, Wifi, WifiOff, RefreshCw, Trophy, Radio, Clock, CheckCircle, Key } from 'lucide-react';
import type { WCMatch } from '../services/sportsDataService';
import {
  fetchWC2026Matches,
  getLiveMatches,
  getRecentFinished,
  getUpcoming,
  teamFlag,
  stageLabel,
  formatMatchDate,
  hasAPIKey,
} from '../services/sportsDataService';

interface Props {
  onLoadAnalysis: () => void;
}

function StatusBadge({ status }: { status: WCMatch['status'] }) {
  if (status === 'IN_PLAY') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      LIVE
    </span>
  );
  if (status === 'PAUSED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      HT
    </span>
  );
  if (status === 'FINISHED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-600/40 text-gray-400 border border-white/10">
      <CheckCircle size={10} />
      FT
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/40 text-gray-500 border border-white/10">
      <Clock size={10} />
      {status === 'SCHEDULED' || status === 'TIMED' ? 'UPCOMING' : status}
    </span>
  );
}

function MatchCard({ match }: { match: WCMatch }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isDone = match.status === 'FINISHED';
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
      isLive
        ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)]'
        : isDone
        ? 'bg-slate-900/40 border-white/8 hover:bg-slate-800/50 hover:border-white/15'
        : 'bg-slate-900/30 border-white/5 hover:bg-slate-800/30'
    }`}>
      {/* Home team */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg shrink-0">{teamFlag(match.homeTeamCode)}</span>
        <span className={`text-sm font-semibold truncate ${isLive ? 'text-white' : isDone ? 'text-gray-200' : 'text-gray-400'}`}>
          {match.homeTeam}
        </span>
      </div>

      {/* Score / time */}
      <div className="shrink-0 text-center min-w-[56px]">
        {hasScore ? (
          <span className={`font-mono font-bold text-base ${isLive ? 'text-white' : 'text-gray-300'}`}>
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span className="text-gray-500 text-xs">{formatMatchDate(match.utcDate).split(' ')[2]}</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`text-sm font-semibold truncate text-right ${isLive ? 'text-white' : isDone ? 'text-gray-200' : 'text-gray-400'}`}>
          {match.awayTeam}
        </span>
        <span className="text-lg shrink-0">{teamFlag(match.awayTeamCode)}</span>
      </div>

      <StatusBadge status={match.status} />
    </div>
  );
}

export function MatchSelector({ onLoadAnalysis }: Props) {
  const [allMatches, setAllMatches] = useState<WCMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function load() {
    if (!hasAPIKey) return;
    setLoading(true);
    const matches = await fetchWC2026Matches();
    setAllMatches(matches);
    setLastFetch(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const live    = getLiveMatches(allMatches);
  const recent  = getRecentFinished(allMatches, 10);
  const upcoming = getUpcoming(allMatches, 6);

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-gray-100 font-sans">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-slate-900/80 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,216,246,0.06),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-3 text-neon-cyan">
            <Globe size={28} />
            <span className="font-['Orbitron'] font-black text-2xl md:text-3xl tracking-widest uppercase">
              FIFA World Cup 2026
            </span>
          </div>
          <p className="text-gray-400 text-sm">USA · Canada · Mexico</p>

          <button
            onClick={onLoadAnalysis}
            className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-bold text-sm hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-all duration-200 shadow-[0_4px_20px_rgba(0,216,246,0.1)]"
          >
            <Trophy size={16} />
            Open Classic Analysis — 2022 Final (ARG vs FRA)
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── No API key notice ─────────────────────────────────────────── */}
        {!hasAPIKey && (
          <div className="flex items-start gap-4 p-5 rounded-2xl border border-yellow-500/25 bg-yellow-950/15">
            <Key size={20} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-semibold text-sm">Live match data needs a free API key</p>
              <p className="text-yellow-400/70 text-xs mt-1 leading-relaxed">
                Get a free key at{' '}
                <span className="font-mono text-yellow-300">football-data.org</span>
                {' '}then add it to your <span className="font-mono">.env</span> file:
              </p>
              <code className="block mt-2 px-3 py-2 rounded-lg bg-black/30 text-xs font-mono text-yellow-200 border border-yellow-500/15">
                VITE_FOOTBALL_API_KEY=your_token_here
              </code>
            </div>
          </div>
        )}

        {/* ── Live matches ──────────────────────────────────────────────── */}
        {hasAPIKey && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                <Radio size={13} className="animate-pulse" />
                Live Now
              </span>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Fetching…' : lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 text-gray-500 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                Fetching live match data…
              </div>
            ) : live.length > 0 ? (
              <div className="flex flex-col gap-2">
                {live.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-slate-900/30 text-gray-500 text-sm">
                <WifiOff size={14} />
                No matches live right now
              </div>
            )}
          </section>
        )}

        {/* ── Recent results ────────────────────────────────────────────── */}
        {hasAPIKey && recent.length > 0 && (
          <section>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-cyan mb-3">
              <CheckCircle size={13} />
              Recent Results
            </span>
            <div className="flex flex-col gap-2">
              {recent.map(m => (
                <div key={m.id}>
                  <div className="text-[10px] text-gray-600 px-1 mb-1">
                    {stageLabel(m.stage)}{m.group ? ` · ${m.group}` : ''} · {formatMatchDate(m.utcDate)}
                  </div>
                  <MatchCard match={m} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming fixtures ─────────────────────────────────────────── */}
        {hasAPIKey && upcoming.length > 0 && (
          <section>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-purple mb-3">
              <Clock size={13} />
              Upcoming Fixtures
            </span>
            <div className="flex flex-col gap-2">
              {upcoming.map(m => (
                <div key={m.id}>
                  <div className="text-[10px] text-gray-600 px-1 mb-1">
                    {stageLabel(m.stage)}{m.group ? ` · ${m.group}` : ''} · {formatMatchDate(m.utcDate)}
                  </div>
                  <MatchCard match={m} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Connection status / offline fallback ─────────────────────── */}
        {hasAPIKey && !loading && allMatches.length === 0 && (
          <div className="flex items-center gap-3 p-5 rounded-2xl border border-white/10 bg-slate-900/30">
            <WifiOff size={18} className="text-gray-500" />
            <div>
              <p className="text-gray-300 text-sm font-semibold">Could not load match data</p>
              <p className="text-gray-500 text-xs mt-1">Check your API key and internet connection, then hit Refresh.</p>
            </div>
          </div>
        )}

        {/* ── Classic analysis card ─────────────────────────────────────── */}
        <section>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
            <Trophy size={13} />
            Classic Full AI Analysis
          </span>
          <div
            onClick={onLoadAnalysis}
            className="cursor-pointer p-5 rounded-2xl border border-amber-500/25 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-500/40 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base group-hover:text-amber-200 transition-colors">
                  2022 FIFA World Cup Final
                </p>
                <p className="text-gray-400 text-xs mt-0.5">Lusail Stadium, Qatar · 18 Dec 2022</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-2xl">🇦🇷</span>
                  <span className="font-mono font-black text-xl text-white">3 – 3</span>
                  <span className="text-2xl">🇫🇷</span>
                  <span className="text-xs text-amber-400/80 ml-1">(ARG 4–2 on pens)</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <Wifi size={11} />
                  Full AI Analysis
                </div>
                <span className="text-xs text-gray-500">Formations · VAR · Momentum</span>
                <span className="text-xs text-gray-500">AI Analyst · Live Predictor</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
