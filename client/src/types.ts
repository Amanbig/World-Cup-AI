export interface PlayerDot {
  id: number
  x: number
  y: number
  pos: string
  num?: number
  name?: string
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
  offside_y?: number | null
  incident_point?: { x: number; y: number } | null
}

export interface MatchInfo {
  home_team: string | null
  away_team: string | null
  minute: number | null
  incident: 'offside' | 'handball' | 'foul' | 'penalty' | 'generic'
}

export type MatchEventType = 'goal' | 'card' | 'var' | 'corner' | 'freekick' | 'penalty' | 'sub'

export interface MatchEventDef {
  id: string
  minute: number
  type: MatchEventType
  team: 'home' | 'away'
  player?: string
  description: string
  prompt: string
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
  streaming?: boolean
  toolStatus?: string
}

export interface LiveMatch {
  id: string
  year: number
  stage: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  note?: string
  live?: boolean
}
