import { useEffect, useRef, useState } from 'react'
import type { VizData, PitchFrame } from '../types'

// Standard pitch dimensions (metres used as SVG units)
const W = 105
const H = 68

interface Props {
  vizData: VizData | null
  homeTeam: string
  awayTeam: string
}

function Dot({ x, y, fill, label }: { x: number; y: number; fill: string; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.8} fill={fill} stroke="white" strokeWidth={0.5} />
      <text x={x} y={y - 3.8} textAnchor="middle" fontSize={2.8} fill="rgba(255,255,255,0.9)" fontWeight="bold">
        {label}
      </text>
    </g>
  )
}

function PitchMarkings() {
  const cy = H / 2
  return (
    <>
      {/* Grass stripes */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={i * 15} y={0} width={15} height={H}
          fill={i % 2 === 0 ? '#2d5a1b' : '#326520'} />
      ))}
      {/* Outer boundary */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke="white" strokeWidth={0.6} />
      {/* Centre line */}
      <line x1={W/2} y1={0} x2={W/2} y2={H} stroke="white" strokeWidth={0.5} />
      {/* Centre circle */}
      <circle cx={W/2} cy={cy} r={9.15} fill="none" stroke="white" strokeWidth={0.5} />
      <circle cx={W/2} cy={cy} r={0.6} fill="white" />
      {/* Left penalty area */}
      <rect x={0} y={(H-40.3)/2} width={16.5} height={40.3} fill="none" stroke="white" strokeWidth={0.5} />
      {/* Left goal area */}
      <rect x={0} y={(H-18.3)/2} width={5.5} height={18.3} fill="none" stroke="white" strokeWidth={0.5} />
      {/* Left goal */}
      <rect x={-1.5} y={(H-7.32)/2} width={1.5} height={7.32} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={0.5} />
      {/* Left penalty spot */}
      <circle cx={11} cy={cy} r={0.5} fill="white" />
      {/* Right penalty area */}
      <rect x={W-16.5} y={(H-40.3)/2} width={16.5} height={40.3} fill="none" stroke="white" strokeWidth={0.5} />
      {/* Right goal area */}
      <rect x={W-5.5} y={(H-18.3)/2} width={5.5} height={18.3} fill="none" stroke="white" strokeWidth={0.5} />
      {/* Right goal */}
      <rect x={W} y={(H-7.32)/2} width={1.5} height={7.32} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={0.5} />
      {/* Right penalty spot */}
      <circle cx={W-11} cy={cy} r={0.5} fill="white" />
    </>
  )
}

export default function PitchView({ vizData, homeTeam, awayTeam }: Props) {
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  // Store interpolated positions for smooth animation
  const [displayed, setDisplayed] = useState<PitchFrame | null>(null)
  const animRef = useRef<ReturnType<typeof setInterval>>()

  // Reset on new vizData
  useEffect(() => {
    setFrameIdx(0)
    setDisplayed(vizData?.frames?.[0] ?? null)
    setPlaying(true)
  }, [vizData])

  // Auto-cycle frames
  useEffect(() => {
    if (!vizData?.frames?.length || !playing) return
    animRef.current = setInterval(() => {
      setFrameIdx(i => {
        const next = (i + 1) % vizData.frames.length
        setDisplayed(vizData.frames[next])
        return next
      })
    }, 1600)
    return () => clearInterval(animRef.current)
  }, [vizData, playing])

  // Jump to frame on manual click
  function goToFrame(i: number) {
    setPlaying(false)
    clearInterval(animRef.current)
    setFrameIdx(i)
    setDisplayed(vizData!.frames[i])
  }

  if (!vizData) {
    return (
      <div className="pitch-empty">
        <div className="pitch-empty-inner">
          <span>⚽</span>
          <p>Ask a VAR question to see the play animated here</p>
        </div>
      </div>
    )
  }

  const frame = displayed ?? vizData.frames[0]

  return (
    <div className="pitch-wrapper">
      {/* Team legend */}
      <div className="pitch-legend">
        <span className="legend-home">● {homeTeam || 'Home'}</span>
        <span className="legend-ball">⬤ Ball</span>
        <span className="legend-away">● {awayTeam || 'Away'}</span>
      </div>

      <svg viewBox={`-2 -1 ${W+4} ${H+2}`} className="pitch-svg">
        <PitchMarkings />

        {/* Offside line */}
        {vizData.offside_x != null && (
          <>
            <line
              x1={vizData.offside_x} y1={0}
              x2={vizData.offside_x} y2={H}
              stroke="#fbbf24" strokeWidth={0.9} strokeDasharray="3,1.5" opacity={0.9}
            />
            <text x={vizData.offside_x + 1} y={4} fontSize={3} fill="#fbbf24" opacity={0.9}>
              OFFSIDE LINE
            </text>
          </>
        )}

        {/* Incident marker */}
        {vizData.incident_point && (
          <circle
            cx={vizData.incident_point.x} cy={vizData.incident_point.y}
            r={4} fill="none" stroke="#ef4444" strokeWidth={0.8}
            strokeDasharray="2,1" opacity={0.85}
          />
        )}

        {/* Away team (red) */}
        {frame.away.map(p => (
          <Dot key={`away-${p.id}`} x={p.x} y={p.y} fill="#ef4444" label={p.pos} />
        ))}

        {/* Home team (green) */}
        {frame.home.map(p => (
          <Dot key={`home-${p.id}`} x={p.x} y={p.y} fill="#4ade80" label={p.pos} />
        ))}

        {/* Ball */}
        <circle
          cx={frame.ball.x} cy={frame.ball.y}
          r={1.8} fill="white" stroke="#555" strokeWidth={0.4}
        />
      </svg>

      {/* Frame label */}
      <div className="pitch-frame-bar">
        <span className="pitch-frame-label">{frame.label}</span>
        <button className="pitch-play-btn" onClick={() => setPlaying(p => !p)}>
          {playing ? '⏸' : '▶'}
        </button>
      </div>

      {/* Frame scrubber */}
      {vizData.frames.length > 1 && (
        <div className="pitch-scrubber">
          {vizData.frames.map((f, i) => (
            <button
              key={i}
              className={`scrub-dot${i === frameIdx ? ' active' : ''}`}
              onClick={() => goToFrame(i)}
              title={f.label}
            />
          ))}
        </div>
      )}

      <p className="pitch-title">{vizData.title}</p>
    </div>
  )
}
