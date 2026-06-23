import { useEffect, useRef, useState } from 'react'
import type { VizData, PlayerDot } from '../types'

// Portrait pitch: 68m wide × 105m tall
const PW = 68
const PH = 105

function pct(x: number, y: number) {
  return { left: `${(x / PW) * 100}%`, top: `${(y / PH) * 100}%` }
}

// Static SVG pitch markings — portrait orientation
function PitchLines() {
  const cx = PW / 2   // 34
  const cy = PH / 2   // 52.5
  return (
    <svg
      viewBox={`0 0 ${PW} ${PH}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {/* Boundary */}
      <rect x={1} y={1} width={PW - 2} height={PH - 2}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
      {/* Centre line (horizontal) */}
      <line x1={1} y1={cy} x2={PW - 1} y2={cy}
        stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
      {/* Centre circle */}
      <circle cx={cx} cy={cy} r={9.15}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
      <circle cx={cx} cy={cy} r={0.9} fill="rgba(255,255,255,0.55)" />

      {/* TOP penalty area */}
      <rect x={(PW - 40.3) / 2} y={1} width={40.3} height={16.5}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
      {/* TOP 6-yard box */}
      <rect x={(PW - 18.3) / 2} y={1} width={18.3} height={5.5}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} />
      {/* TOP goal */}
      <rect x={(PW - 7.32) / 2} y={0} width={7.32} height={1.5}
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
      {/* TOP penalty spot */}
      <circle cx={cx} cy={11} r={0.7} fill="rgba(255,255,255,0.55)" />
      {/* TOP penalty arc */}
      <path d={`M ${cx - 9} 17.5 A 9.15 9.15 0 0 0 ${cx + 9} 17.5`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.6} />

      {/* BOTTOM penalty area */}
      <rect x={(PW - 40.3) / 2} y={PH - 17.5} width={40.3} height={16.5}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
      {/* BOTTOM 6-yard box */}
      <rect x={(PW - 18.3) / 2} y={PH - 6.5} width={18.3} height={5.5}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} />
      {/* BOTTOM goal */}
      <rect x={(PW - 7.32) / 2} y={PH - 1.5} width={7.32} height={1.5}
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
      {/* BOTTOM penalty spot */}
      <circle cx={cx} cy={PH - 11} r={0.7} fill="rgba(255,255,255,0.55)" />
      {/* BOTTOM penalty arc */}
      <path d={`M ${cx - 9} ${PH - 17.5} A 9.15 9.15 0 0 1 ${cx + 9} ${PH - 17.5}`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.6} />
    </svg>
  )
}

interface DotProps {
  player: PlayerDot
  team: 'home' | 'away'
  highlighted?: boolean
}

function Dot({ player, team, highlighted }: DotProps) {
  const style = {
    ...pct(player.x, player.y),
    transition: 'left 0.7s cubic-bezier(.4,0,.2,1), top 0.7s cubic-bezier(.4,0,.2,1)',
  }
  return (
    <div
      key={`${team}-${player.id}`}
      className={`pd pd-${team}${highlighted ? ' pd-highlight' : ''}`}
      style={style}
    >
      <span className="pd-num">{player.num ?? player.pos}</span>
      {player.name && <span className="pd-name">{player.name}</span>}
    </div>
  )
}

interface Props {
  vizData: VizData | null
  homeTeam: string
  awayTeam: string
}

export default function PitchView({ vizData, homeTeam, awayTeam }: Props) {
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    clearInterval(intervalRef.current)
    setFrameIdx(0)
    // Auto-play new viz after a brief settle delay
    if (vizData?.frames && vizData.frames.length > 1) {
      const t = setTimeout(() => setPlaying(true), 500)
      return () => clearTimeout(t)
    }
    setPlaying(false)
  }, [vizData])

  useEffect(() => {
    if (!playing || !vizData?.frames?.length) return
    intervalRef.current = setInterval(() => {
      setFrameIdx(i => {
        const next = i + 1
        if (next >= vizData!.frames.length) {
          clearInterval(intervalRef.current)
          setPlaying(false)
          return i
        }
        return next
      })
    }, 1500)
    return () => clearInterval(intervalRef.current)
  }, [playing, vizData])

  if (!vizData?.frames?.length) {
    return (
      <div className="pitch-wrap">
        <div className="pitch-canvas pitch-empty">
          <PitchLines />
          <div className="pitch-empty-msg">
            <span>📺</span>
            <p>Ask a VAR question — the play animates here</p>
          </div>
        </div>
        <div className="pitch-legend">
          <span className="leg-home">⬤ {homeTeam || 'Home'}</span>
          <span className="leg-ball">⬤ Ball</span>
          <span className="leg-away">⬤ {awayTeam || 'Away'}</span>
        </div>
      </div>
    )
  }

  const frames = vizData.frames
  const frame  = frames[frameIdx]
  const total  = frames.length

  return (
    <div className="pitch-wrap">
      {/* Team names above/below the pitch */}
      <div className="pitch-team-label away-label">
        <span className="ptl-dot away" />
        {awayTeam || 'Away'}
      </div>

      <div className="pitch-canvas">
        <PitchLines />

        {/* Offside line (horizontal) */}
        {vizData.offside_y != null && (
          <div className="offside-bar" style={{ top: `${(vizData.offside_y / PH) * 100}%` }}>
            <span className="offside-tag">OFFSIDE</span>
          </div>
        )}

        {/* Incident pulse */}
        {vizData.incident_point && (
          <div className="incident-ring" style={pct(vizData.incident_point.x, vizData.incident_point.y)} />
        )}

        {/* Away team dots (top half — blue) */}
        {frame.away.map(p => <Dot key={`away-${p.id}`} player={p} team="away" />)}

        {/* Home team dots (bottom half — green) */}
        {frame.home.map(p => <Dot key={`home-${p.id}`} player={p} team="home" />)}

        {/* Ball */}
        <div
          className="ball-dot"
          style={{ ...pct(frame.ball.x, frame.ball.y), transition: 'left 0.7s cubic-bezier(.4,0,.2,1), top 0.7s cubic-bezier(.4,0,.2,1)' }}
        />

        {/* Floating frame label */}
        <div className="frame-label-float">{frame.label}</div>
      </div>

      <div className="pitch-team-label home-label">
        <span className="ptl-dot home" />
        {homeTeam || 'Home'}
      </div>

      {/* Controls */}
      <div className="pitch-controls">
        <div className="pitch-btns">
          <button className="pc-btn" onClick={() => { setPlaying(false); setFrameIdx(i => Math.max(0, i - 1)) }} disabled={frameIdx === 0}>‹</button>
          <button
            className={`pc-btn play${playing ? ' on' : ''}`}
            onClick={() => {
              if (playing) { setPlaying(false) }
              else { if (frameIdx === total - 1) setFrameIdx(0); setPlaying(true) }
            }}
          >
            {playing ? '⏸' : '▶ Play'}
          </button>
          <button className="pc-btn" onClick={() => { setPlaying(false); setFrameIdx(i => Math.min(total - 1, i + 1)) }} disabled={frameIdx === total - 1}>›</button>
        </div>
        <div className="pc-pips">
          {frames.map((_, i) => (
            <button key={i} className={`pc-pip${i === frameIdx ? ' on' : ''}`} onClick={() => { setPlaying(false); setFrameIdx(i) }} title={frames[i].label} />
          ))}
          <span className="pc-count">{frameIdx + 1}/{total}</span>
        </div>
      </div>

      <p className="pitch-title-text">{vizData.title}</p>

      <div className="pitch-legend">
        <span className="leg-home">⬤ {homeTeam || 'Home'}</span>
        <span className="leg-ball">⬤ Ball</span>
        <span className="leg-away">⬤ {awayTeam || 'Away'}</span>
      </div>
    </div>
  )
}
