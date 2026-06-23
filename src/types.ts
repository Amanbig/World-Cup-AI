export interface PlayerDot {
  id: number
  x: number   // 0–105 (pitch length in metres)
  y: number   // 0–68  (pitch width in metres)
  pos: string // "ST", "CB", "GK", etc.
}

export interface PitchFrame {
  label: string
  ball: { x: number; y: number }
  home: PlayerDot[]
  away: PlayerDot[]
}

export interface VizData {
  title: string
  frames: PitchFrame[]
  offside_x?: number | null
  incident_point?: { x: number; y: number } | null
}

export interface MatchInfo {
  home_team: string | null
  away_team: string | null
  minute: number | null
  incident: 'offside' | 'handball' | 'foul' | 'penalty' | 'generic'
}

export type EventType = 'goal' | 'card' | 'var' | 'sub' | 'generic'

export interface MatchEvent {
  id: string
  minute: number | null
  type: EventType
  description: string
  team?: 'home' | 'away'
}

export interface Source {
  section: string
  page: string
  source: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  incidentType?: string
  loading?: boolean
}
