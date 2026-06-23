import PitchView from './PitchView'
import type { MatchInfo, MatchEvent, VizData } from '../types'

interface Props {
  matchInfo: MatchInfo
  events: MatchEvent[]
  vizData: VizData | null
  onMatchInfoChange: (info: Partial<MatchInfo>) => void
}

const EVENT_ICONS: Record<string, string> = {
  goal:    '⚽',
  card:    '🟨',
  var:     '📺',
  sub:     '🔄',
  generic: 'ℹ️',
}

const INCIDENT_LABELS: Record<string, string> = {
  offside:  'Offside',
  handball: 'Handball',
  foul:     'Foul',
  penalty:  'Penalty',
  generic:  'VAR Review',
}

export default function MatchSidebar({ matchInfo, events, vizData, onMatchInfoChange }: Props) {
  const home = matchInfo.home_team || 'Home'
  const away = matchInfo.away_team || 'Away'

  return (
    <aside className="match-sidebar">
      {/* ── Teams & Score ───────────────────── */}
      <div className="sidebar-teams">
        <div className="team home-team">
          <div className="team-dot home" />
          <input
            className="team-name-input"
            value={matchInfo.home_team ?? ''}
            placeholder="Home team"
            onChange={e => onMatchInfoChange({ home_team: e.target.value || null })}
          />
        </div>

        <div className="score-block">
          <span className="score-digit">{countGoals(events, 'home')}</span>
          <span className="score-sep">–</span>
          <span className="score-digit">{countGoals(events, 'away')}</span>
          {matchInfo.minute && (
            <div className="match-minute">{matchInfo.minute}'</div>
          )}
        </div>

        <div className="team away-team">
          <input
            className="team-name-input right"
            value={matchInfo.away_team ?? ''}
            placeholder="Away team"
            onChange={e => onMatchInfoChange({ away_team: e.target.value || null })}
          />
          <div className="team-dot away" />
        </div>
      </div>

      {/* ── Incident badge ──────────────────── */}
      {matchInfo.incident && matchInfo.incident !== 'generic' && (
        <div className="incident-badge">
          📺 VAR: {INCIDENT_LABELS[matchInfo.incident]}
          {matchInfo.minute ? ` — ${matchInfo.minute}'` : ''}
        </div>
      )}

      {/* ── Pitch visualisation ─────────────── */}
      <PitchView vizData={vizData} homeTeam={home} awayTeam={away} />

      {/* ── Events timeline ─────────────────── */}
      <div className="events-section">
        <p className="events-title">Match Events</p>
        {events.length === 0 ? (
          <p className="events-empty">Events appear as you ask questions</p>
        ) : (
          <ul className="events-list">
            {[...events].reverse().map(ev => (
              <li key={ev.id} className={`event-item event-${ev.type}`}>
                <span className="event-icon">{EVENT_ICONS[ev.type] ?? 'ℹ️'}</span>
                <span className="event-minute">{ev.minute != null ? `${ev.minute}'` : '–'}</span>
                <span className="event-desc">{ev.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function countGoals(events: MatchEvent[], team: 'home' | 'away'): number {
  return events.filter(e => e.type === 'goal' && e.team === team).length
}
