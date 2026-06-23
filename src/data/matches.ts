export interface HistoricalMatch {
  id: string
  year: number
  stage: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  note?: string  // extra context, e.g. "AET · Pen 4-2"
}

export const HISTORICAL_MATCHES: HistoricalMatch[] = [
  // ── 2022 Qatar ──────────────────────────────────────
  { id: "2022-final",      year: 2022, stage: "Final",          home: "Argentina",  away: "France",      homeScore: 3, awayScore: 3, note: "AET · Pen 4-2" },
  { id: "2022-sf1",        year: 2022, stage: "Semi-final",     home: "Argentina",  away: "Croatia",     homeScore: 3, awayScore: 0 },
  { id: "2022-sf2",        year: 2022, stage: "Semi-final",     home: "France",     away: "Morocco",     homeScore: 2, awayScore: 0 },
  { id: "2022-qf-arg-ned", year: 2022, stage: "Quarter-final",  home: "Argentina",  away: "Netherlands", homeScore: 2, awayScore: 2, note: "Pen 4-3" },
  { id: "2022-qf-fra-eng", year: 2022, stage: "Quarter-final",  home: "France",     away: "England",     homeScore: 2, awayScore: 1 },
  { id: "2022-qf-mar-por", year: 2022, stage: "Quarter-final",  home: "Morocco",    away: "Portugal",    homeScore: 1, awayScore: 0 },
  { id: "2022-qf-cro-bra", year: 2022, stage: "Quarter-final",  home: "Croatia",    away: "Brazil",      homeScore: 1, awayScore: 1, note: "Pen 4-2" },
  { id: "2022-r16-arg-aus",year: 2022, stage: "Round of 16",    home: "Argentina",  away: "Australia",   homeScore: 2, awayScore: 1 },
  { id: "2022-r16-eng-sen",year: 2022, stage: "Round of 16",    home: "England",    away: "Senegal",     homeScore: 3, awayScore: 0 },
  { id: "2022-r16-fra-pol",year: 2022, stage: "Round of 16",    home: "France",     away: "Poland",      homeScore: 3, awayScore: 1 },
  { id: "2022-r16-bra-kor",year: 2022, stage: "Round of 16",    home: "Brazil",     away: "South Korea", homeScore: 4, awayScore: 1 },
  { id: "2022-grp-arg-sau",year: 2022, stage: "Group Stage",    home: "Argentina",  away: "Saudi Arabia",homeScore: 1, awayScore: 2 },

  // ── 2018 Russia ─────────────────────────────────────
  { id: "2018-final",      year: 2018, stage: "Final",          home: "France",     away: "Croatia",     homeScore: 4, awayScore: 2 },
  { id: "2018-sf1",        year: 2018, stage: "Semi-final",     home: "France",     away: "Belgium",     homeScore: 1, awayScore: 0 },
  { id: "2018-sf2",        year: 2018, stage: "Semi-final",     home: "Croatia",    away: "England",     homeScore: 2, awayScore: 1 },
  { id: "2018-qf-uru-fra", year: 2018, stage: "Quarter-final",  home: "Uruguay",    away: "France",      homeScore: 0, awayScore: 2 },
  { id: "2018-qf-bra-bel", year: 2018, stage: "Quarter-final",  home: "Brazil",     away: "Belgium",     homeScore: 1, awayScore: 2 },
  { id: "2018-r16-arg-fra",year: 2018, stage: "Round of 16",    home: "Argentina",  away: "France",      homeScore: 3, awayScore: 4 },
  { id: "2018-r16-por-uru",year: 2018, stage: "Round of 16",    home: "Portugal",   away: "Uruguay",     homeScore: 1, awayScore: 2 },
  { id: "2018-r16-esp-rus",year: 2018, stage: "Round of 16",    home: "Spain",      away: "Russia",      homeScore: 1, awayScore: 1, note: "Pen 3-4" },

  // ── 2014 Brazil ─────────────────────────────────────
  { id: "2014-final",      year: 2014, stage: "Final",          home: "Germany",    away: "Argentina",   homeScore: 1, awayScore: 0, note: "AET" },
  { id: "2014-sf1",        year: 2014, stage: "Semi-final",     home: "Brazil",     away: "Germany",     homeScore: 1, awayScore: 7 },
  { id: "2014-sf2",        year: 2014, stage: "Semi-final",     home: "Netherlands",away: "Argentina",   homeScore: 0, awayScore: 0, note: "Pen 2-4" },
  { id: "2014-qf-bra-col", year: 2014, stage: "Quarter-final",  home: "Brazil",     away: "Colombia",    homeScore: 2, awayScore: 1 },
  { id: "2014-qf-ger-fra", year: 2014, stage: "Quarter-final",  home: "Germany",    away: "France",      homeScore: 1, awayScore: 0 },
]

export const YEARS = [...new Set(HISTORICAL_MATCHES.map(m => m.year))].sort((a, b) => b - a)
