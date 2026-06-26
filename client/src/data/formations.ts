import type { PitchFrame, PlayerDot, VizData } from '../types'

export type FormationName = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2' | '4-5-1'

// Known formations for well-recognised World Cup teams
const TEAM_FORMATION: Record<string, FormationName> = {
  'Argentina':    '4-3-3',
  'France':       '4-2-3-1',
  'Croatia':      '4-3-3',
  'Morocco':      '4-5-1',
  'Brazil':       '4-3-3',
  'Germany':      '4-2-3-1',
  'Netherlands':  '3-5-2',
  'England':      '4-2-3-1',
  'Portugal':     '4-2-3-1',
  'Spain':        '4-3-3',
  'Colombia':     '4-2-3-1',
  'Belgium':      '3-5-2',
  'Australia':    '4-4-2',
  'Saudi Arabia': '4-5-1',
  'USA':          '4-3-3',
  'Mexico':       '4-3-3',
  'Uruguay':      '4-3-3',
  'Ecuador':      '4-4-2',
  'Ghana':        '4-2-3-1',
  'Senegal':      '4-3-3',
  'Japan':        '4-2-3-1',
  'South Korea':  '4-2-3-1',
  'Iran':         '4-5-1',
  'Poland':       '4-4-2',
  'Switzerland':  '3-5-2',
  'Serbia':       '3-5-2',
  'Denmark':      '3-4-3',
  'Wales':        '4-2-3-1',
  'Canada':       '3-5-2',
  'Cameroon':     '4-4-2',
  'Ghana':        '4-2-3-1',
  'Tunisia':      '4-4-2',
  'Costa Rica':   '4-5-1',
  'Qatar':        '4-4-2',
}

interface BasePlayer {
  id: number
  pos: string
  x: number
  y: number
}

// HOME team defends BOTTOM goal (y≈105). IDs 1–11: GK → defenders → mids → forwards.
const HOME: Record<FormationName, BasePlayer[]> = {
  '4-3-3': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'RB',  x: 55, y: 82  },
    { id: 3,  pos: 'CB',  x: 44, y: 84  },
    { id: 4,  pos: 'CB',  x: 24, y: 84  },
    { id: 5,  pos: 'LB',  x: 13, y: 82  },
    { id: 6,  pos: 'CM',  x: 50, y: 68  },
    { id: 7,  pos: 'CM',  x: 34, y: 70  },
    { id: 8,  pos: 'CM',  x: 18, y: 68  },
    { id: 9,  pos: 'RW',  x: 58, y: 57  },
    { id: 10, pos: 'CF',  x: 34, y: 55  },
    { id: 11, pos: 'LW',  x: 10, y: 57  },
  ],
  '4-4-2': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'RB',  x: 56, y: 82  },
    { id: 3,  pos: 'CB',  x: 44, y: 84  },
    { id: 4,  pos: 'CB',  x: 24, y: 84  },
    { id: 5,  pos: 'LB',  x: 12, y: 82  },
    { id: 6,  pos: 'RM',  x: 58, y: 70  },
    { id: 7,  pos: 'CM',  x: 44, y: 68  },
    { id: 8,  pos: 'CM',  x: 24, y: 68  },
    { id: 9,  pos: 'LM',  x: 10, y: 70  },
    { id: 10, pos: 'ST',  x: 44, y: 57  },
    { id: 11, pos: 'ST',  x: 24, y: 57  },
  ],
  '4-2-3-1': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'RB',  x: 56, y: 82  },
    { id: 3,  pos: 'CB',  x: 44, y: 84  },
    { id: 4,  pos: 'CB',  x: 24, y: 84  },
    { id: 5,  pos: 'LB',  x: 12, y: 82  },
    { id: 6,  pos: 'CDM', x: 42, y: 73  },
    { id: 7,  pos: 'CDM', x: 26, y: 73  },
    { id: 8,  pos: 'RAM', x: 56, y: 62  },
    { id: 9,  pos: 'CAM', x: 34, y: 60  },
    { id: 10, pos: 'LAM', x: 12, y: 62  },
    { id: 11, pos: 'CF',  x: 34, y: 52  },
  ],
  '3-5-2': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'CB',  x: 52, y: 83  },
    { id: 3,  pos: 'CB',  x: 34, y: 85  },
    { id: 4,  pos: 'CB',  x: 16, y: 83  },
    { id: 5,  pos: 'RWB', x: 62, y: 72  },
    { id: 6,  pos: 'CM',  x: 48, y: 68  },
    { id: 7,  pos: 'CM',  x: 34, y: 66  },
    { id: 8,  pos: 'CM',  x: 20, y: 68  },
    { id: 9,  pos: 'LWB', x: 6,  y: 72  },
    { id: 10, pos: 'ST',  x: 44, y: 56  },
    { id: 11, pos: 'ST',  x: 24, y: 56  },
  ],
  '5-3-2': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'RWB', x: 62, y: 80  },
    { id: 3,  pos: 'CB',  x: 50, y: 84  },
    { id: 4,  pos: 'CB',  x: 34, y: 86  },
    { id: 5,  pos: 'CB',  x: 18, y: 84  },
    { id: 6,  pos: 'LWB', x: 6,  y: 80  },
    { id: 7,  pos: 'CM',  x: 48, y: 68  },
    { id: 8,  pos: 'CM',  x: 34, y: 66  },
    { id: 9,  pos: 'CM',  x: 20, y: 68  },
    { id: 10, pos: 'ST',  x: 44, y: 56  },
    { id: 11, pos: 'ST',  x: 24, y: 56  },
  ],
  '4-5-1': [
    { id: 1,  pos: 'GK',  x: 34, y: 100 },
    { id: 2,  pos: 'RB',  x: 56, y: 82  },
    { id: 3,  pos: 'CB',  x: 44, y: 84  },
    { id: 4,  pos: 'CB',  x: 24, y: 84  },
    { id: 5,  pos: 'LB',  x: 12, y: 82  },
    { id: 6,  pos: 'RM',  x: 60, y: 68  },
    { id: 7,  pos: 'CM',  x: 47, y: 66  },
    { id: 8,  pos: 'CM',  x: 34, y: 64  },
    { id: 9,  pos: 'CM',  x: 21, y: 66  },
    { id: 10, pos: 'LM',  x: 8,  y: 68  },
    { id: 11, pos: 'CF',  x: 34, y: 53  },
  ],
}

// AWAY team defends TOP goal (y≈0): mirror y = 105 - y_home
const AWAY: Record<FormationName, BasePlayer[]> = Object.fromEntries(
  Object.entries(HOME).map(([k, players]) => [
    k,
    players.map(p => ({ ...p, y: 105 - p.y })),
  ])
) as Record<FormationName, BasePlayer[]>

function resolveFormation(name: string): FormationName {
  return (name in HOME ? name : '4-3-3') as FormationName
}

function getBase(name: string, side: 'home' | 'away'): BasePlayer[] {
  return side === 'home' ? HOME[resolveFormation(name)] : AWAY[resolveFormation(name)]
}

// Raw viz_data as received from the SSE stream (new delta format)
interface RawMove {
  team: 'home' | 'away'
  id: number
  x: number
  y: number
}

interface RawDeltaFrame {
  label: string
  ball: { x: number; y: number }
  moves: RawMove[]
}

interface RawPlayerMeta {
  id: number
  name?: string
  num?: number
}

interface RawVizData {
  title: string
  home_formation?: string
  away_formation?: string
  // player metadata (names/numbers) specified once
  players?: { home?: RawPlayerMeta[]; away?: RawPlayerMeta[] }
  frames: RawDeltaFrame[] | PitchFrame[]
  offside_y?: number | null
  incident_point?: { x: number; y: number } | null
}

function isDeltaFrames(frames: RawDeltaFrame[] | PitchFrame[]): frames is RawDeltaFrame[] {
  return frames.length === 0 || !('home' in frames[0])
}

export function hydrateVizData(raw: RawVizData): import('../types').VizData {
  // Old format: frames already have home/away PlayerDot arrays — pass through
  if (!isDeltaFrames(raw.frames)) {
    return raw as import('../types').VizData
  }

  // Build name/number lookup from the players metadata block
  const nameLookup = { home: new Map<number, RawPlayerMeta>(), away: new Map<number, RawPlayerMeta>() }
  for (const p of raw.players?.home ?? []) nameLookup.home.set(p.id, p)
  for (const p of raw.players?.away ?? []) nameLookup.away.set(p.id, p)

  // Initialise mutable position maps from base formation
  const homeBase = getBase(raw.home_formation ?? '4-3-3', 'home')
  const awayBase = getBase(raw.away_formation ?? '4-4-2', 'away')

  const homePos = new Map<number, PlayerDot>(
    homeBase.map(p => {
      const meta = nameLookup.home.get(p.id)
      return [p.id, { id: p.id, pos: p.pos, x: p.x, y: p.y, name: meta?.name, num: meta?.num }]
    })
  )
  const awayPos = new Map<number, PlayerDot>(
    awayBase.map(p => {
      const meta = nameLookup.away.get(p.id)
      return [p.id, { id: p.id, pos: p.pos, x: p.x, y: p.y, name: meta?.name, num: meta?.num }]
    })
  )

  const hydratedFrames: PitchFrame[] = (raw.frames as RawDeltaFrame[]).map(frame => {
    for (const mv of frame.moves ?? []) {
      const map = mv.team === 'home' ? homePos : awayPos
      const prev = map.get(mv.id)
      if (prev) map.set(mv.id, { ...prev, x: mv.x, y: mv.y })
    }
    return {
      label: frame.label,
      ball: frame.ball,
      home: Array.from(homePos.values()),
      away: Array.from(awayPos.values()),
    }
  })

  return {
    title: raw.title,
    frames: hydratedFrames,
    offside_y: raw.offside_y,
    incident_point: raw.incident_point,
  }
}

/** Show both teams in their default formation the moment a match is selected. */
export function createKickoffVizData(homeTeam: string, awayTeam: string): VizData {
  const homeFm = TEAM_FORMATION[homeTeam] ?? '4-3-3'
  const awayFm = TEAM_FORMATION[awayTeam] ?? '4-4-2'

  const homeBase = getBase(homeFm, 'home')
  const awayBase = getBase(awayFm, 'away')

  const toPlayerDot = (p: BasePlayer): PlayerDot => ({
    id: p.id, pos: p.pos, x: p.x, y: p.y,
  })

  return {
    title: `${homeTeam} vs ${awayTeam}`,
    frames: [{
      label: 'Kick-off',
      ball: { x: 34, y: 52.5 },
      home: homeBase.map(toPlayerDot),
      away: awayBase.map(toPlayerDot),
    }],
    offside_y: null,
    incident_point: null,
  }
}
