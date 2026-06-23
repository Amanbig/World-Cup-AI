import type { MatchInfo, MatchEvent } from '../types'

interface Props {
  matchInfo: MatchInfo
  events: MatchEvent[]
  onMatchInfoChange: (info: Partial<MatchInfo>) => void
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', card: '🟨', var: '📺', sub: '🔄', generic: 'ℹ️',
}

const INCIDENT_LABELS: Record<string, string> = {
  offside: 'Offside', handball: 'Handball', foul: 'Foul',
  penalty: 'Penalty', generic: 'VAR Review',
}

function countGoals(events: MatchEvent[], team: 'home' | 'away') {
  return events.filter(e => e.type === 'goal' && e.team === team).length
}

export default function MatchSidebar({ matchInfo, events, onMatchInfoChange }: Props) {
  return (
    <aside className="match-sidebar">

      {/* ── Scoreboard ─────────────────────── */}
      <div className="sb-header">LIVE MATCH</div>

      <div className="sb-teams">
        <div className="sb-team">
          <div className="sb-badge home-badge" />
          <input
            className="sb-input"
            value={matchInfo.home_team ?? ''}
            placeholder="Home team"
            onChange={e => onMatchInfoChange({ home_team: e.target.value || null })}
          />
        </div>

        <div className="sb-score-col">
          <div className="sb-score">
            <span>{countGoals(events, 'home')}</span>
            <span className="sb-dash">–</span>
            <span>{countGoals(events, 'away')}</span>
          </div>
          <div className={`sb-clock${matchInfo.minute ? '' : ' dim'}`}>
            {matchInfo.minute ? `${matchInfo.minute}'` : "–'"}
          </div>
        </div>

        <div className="sb-team right">
          <input
            className="sb-input right"
            value={matchInfo.away_team ?? ''}
            placeholder="Away team"
            onChange={e => onMatchInfoChange({ away_team: e.target.value || null })}
          />
          <div className="sb-badge away-badge" />
        </div>
      </div>

      {/* VAR incident pill */}
      {matchInfo.incident && matchInfo.incident !== 'generic' && (
        <div className="sb-var-pill">
          <span className="sb-var-dot" />
          VAR: {INCIDENT_LABELS[matchInfo.incident]}
          {matchInfo.minute ? ` — ${matchInfo.minute}'` : ''}
        </div>
      )}

      {/* Legend */}
      <div className="sb-legend">
        <span className="sb-leg home">⬤ Home</span>
        <span className="sb-leg ball">⬤ Ball</span>
        <span className="sb-leg away">⬤ Away</span>
      </div>

      {/* ── Events timeline ─────────────────── */}
      <div className="sb-events">
        <p className="sb-events-title">Match Events</p>
        {events.length === 0
          ? <p className="sb-events-empty">Events appear as you ask VAR questions</p>
          : (
            <ul className="sb-events-list">
              {[...events].reverse().map(ev => (
                <li key={ev.id} className={`sb-event ev-${ev.type}`}>
                  <span>{EVENT_ICONS[ev.type]}</span>
                  <span className="ev-min">{ev.minute != null ? `${ev.minute}'` : '–'}</span>
                  <span className="ev-desc">{ev.description}</span>
                </li>
              ))}
            </ul>
          )
        }
      </div>

    </aside>
  )
}
