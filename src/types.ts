export interface PlayerDot {
  id: number
  x: number    // 0–68  (pitch WIDTH  — horizontal axis in portrait view)
  y: number    // 0–105 (pitch LENGTH — vertical axis in portrait view)
  pos: string  // position abbreviation: "GK", "CB", "ST", etc.
  num?: number // jersey number shown inside the circle
  name?: string // player surname shown below the circle
}

export interface PitchFrame {
  label: string
  ball: { x: number; y: number }
  home: PlayerDot[]  // home team defends BOTTOM goal (y ≈ 88–105)
  away: PlayerDot[]  // away team defends TOP  goal (y ≈ 0–17)
}

export interface VizData {
  title: string
  frames: PitchFrame[]
  offside_y?: number | null          // y-coordinate of horizontal offside line
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
