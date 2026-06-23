// football-data.org v4 API — free tier, 10 req/min
// Get a free key at https://www.football-data.org/client/register

const API_BASE = (import.meta.env.VITE_FOOTBALL_API_BASE as string | undefined) ?? 'https://api.football-data.org/v4';
const API_KEY  = (import.meta.env.VITE_FOOTBALL_API_KEY  as string | undefined) ?? '';

export interface WCMatch {
  id: string;
  homeTeam: string;
  homeTeamCode: string;
  awayTeam: string;
  awayTeamCode: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  stage: string;
  group: string | null;
  utcDate: string;
}

interface APITeam  { name: string; tla: string }
interface APIScore { fullTime: { home: number | null; away: number | null } }
interface APIMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: APITeam;
  awayTeam: APITeam;
  score: APIScore;
}

async function apiFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function mapMatch(m: APIMatch): WCMatch {
  return {
    id: String(m.id),
    homeTeam: m.homeTeam?.name ?? 'TBD',
    homeTeamCode: m.homeTeam?.tla ?? '',
    awayTeam: m.awayTeam?.name ?? 'TBD',
    awayTeamCode: m.awayTeam?.tla ?? '',
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    status: m.status as WCMatch['status'],
    stage: m.stage ?? '',
    group: m.group ?? null,
    utcDate: m.utcDate,
  };
}

export async function fetchWC2026Matches(): Promise<WCMatch[]> {
  const data = await apiFetch<{ matches: APIMatch[] }>('/competitions/WC/matches?season=2026');
  if (!data?.matches) return [];
  return data.matches.map(mapMatch);
}

export function getLiveMatches(matches: WCMatch[]): WCMatch[] {
  return matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
}

export function getRecentFinished(matches: WCMatch[], count = 12): WCMatch[] {
  return matches
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, count);
}

export function getUpcoming(matches: WCMatch[], count = 6): WCMatch[] {
  const now = Date.now();
  return matches
    .filter(m => (m.status === 'SCHEDULED' || m.status === 'TIMED') && new Date(m.utcDate).getTime() > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, count);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  ARG:'🇦🇷', FRA:'🇫🇷', BRA:'🇧🇷', ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER:'🇩🇪', ESP:'🇪🇸',
  ITA:'🇮🇹', POR:'🇵🇹', NED:'🇳🇱', BEL:'🇧🇪', USA:'🇺🇸', MEX:'🇲🇽',
  CAN:'🇨🇦', JPN:'🇯🇵', KOR:'🇰🇷', MAR:'🇲🇦', SEN:'🇸🇳', URU:'🇺🇾',
  CHI:'🇨🇱', COL:'🇨🇴', CRO:'🇭🇷', SUI:'🇨🇭', DEN:'🇩🇰', SWE:'🇸🇪',
  AUS:'🇦🇺', QAT:'🇶🇦', TUN:'🇹🇳', GHA:'🇬🇭', CMR:'🇨🇲', NGA:'🇳🇬',
  ECU:'🇪🇨', SAU:'🇸🇦', IRN:'🇮🇷', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  SRB:'🇷🇸', POL:'🇵🇱', AUT:'🇦🇹', UKR:'🇺🇦', ROU:'🇷🇴', HUN:'🇭🇺',
  TUR:'🇹🇷', SVK:'🇸🇰', NOR:'🇳🇴', FIN:'🇫🇮', GRE:'🇬🇷', CZE:'🇨🇿',
  PAN:'🇵🇦', CRC:'🇨🇷', HON:'🇭🇳', JAM:'🇯🇲', VEN:'🇻🇪', PER:'🇵🇪',
  PAR:'🇵🇾', BOL:'🇧🇴', ALG:'🇩🇿', EGY:'🇪🇬', CIV:'🇨🇮', MLI:'🇲🇱',
  CMV:'🇨🇻', MOZ:'🇲🇿', ZIM:'🇿🇼',
};

export function teamFlag(tla: string): string {
  return FLAG_MAP[tla] ?? '🏳️';
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:   'Group Stage',
  LAST_16:       'Round of 16',
  QUARTER_FINALS:'Quarter-Finals',
  SEMI_FINALS:   'Semi-Finals',
  THIRD_PLACE:   '3rd Place',
  FINAL:         'Final',
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage.replace(/_/g, ' ');
}

export function formatMatchDate(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

export const hasAPIKey = !!API_KEY;
