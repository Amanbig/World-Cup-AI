export interface HistoricalMatch {
  id: string
  year: number
  stage: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  note?: string
  queries: string[]  // match-specific VAR/tactical questions for the AI
}

export const HISTORICAL_MATCHES: HistoricalMatch[] = [
  // ── 2022 Qatar ──────────────────────────────────────
  {
    id: "2022-final", year: 2022, stage: "Final",
    home: "Argentina", away: "France", homeScore: 3, awayScore: 3, note: "AET · Pen 4-2",
    queries: [
      "In the 2022 World Cup Final, France were awarded a penalty in the 80th minute for a handball by Gonzalo Montiel — was VAR correct to award it?",
      "Kylian Mbappé scored a hat-trick in the 2022 Final. Were any of his goals checked by VAR for offside?",
      "Argentina's third goal in the Final came from a Lautaro Martínez shot — show the player positions at the moment of the VAR offside check.",
    ],
  },
  {
    id: "2022-sf1", year: 2022, stage: "Semi-final",
    home: "Argentina", away: "Croatia", homeScore: 3, awayScore: 0,
    queries: [
      "Argentina were awarded a penalty vs Croatia in the 81st minute after Livakovic brought down Álvarez — was it inside the box?",
      "Show how Julián Álvarez dribbled past the Croatian defence for his second goal — tactical analysis.",
    ],
  },
  {
    id: "2022-sf2", year: 2022, stage: "Semi-final",
    home: "France", away: "Morocco", homeScore: 2, awayScore: 0,
    queries: [
      "Analyse France's pressing trap in the 2022 semi-final that led to Theo Hernández's opening goal.",
      "Morocco defended a 4-3-3 low block for most of the tournament — how did France finally break it down?",
    ],
  },
  {
    id: "2022-qf-arg-ned", year: 2022, stage: "Quarter-final",
    home: "Argentina", away: "Netherlands", homeScore: 2, awayScore: 2, note: "Pen 4-3",
    queries: [
      "In the 83rd minute vs Netherlands, Wout Weghorst headed a cross to make it 2-1 — was the Argentine wall set up correctly for the free kick?",
      "Netherlands equalized in the 11th minute of stoppage time from a free kick. Show the defensive wall positions and explain the VAR offside check.",
      "Argentina had two players sent off in the quarter-final vs Netherlands. Analyse the VAR review of Leandro Paredes' tackle.",
    ],
  },
  {
    id: "2022-qf-fra-eng", year: 2022, stage: "Quarter-final",
    home: "France", away: "England", homeScore: 2, awayScore: 1,
    queries: [
      "England's penalty in the 2022 quarter-final was awarded after Tchouaméni was judged to have pushed Saka — show the incident positions.",
      "Harry Kane scored England's penalty but then missed the second one at 2-1. Show the penalty spot and goalkeeper position for each attempt.",
    ],
  },
  {
    id: "2022-qf-mar-por", year: 2022, stage: "Quarter-final",
    home: "Morocco", away: "Portugal", homeScore: 1, awayScore: 0,
    queries: [
      "Morocco beat Portugal 1-0 in the quarter-final. Show the defensive formation Morocco used to keep Ronaldo and Fernández quiet.",
      "En-Nesyri's headed winner for Morocco — show the aerial duel positions and the offside line check.",
    ],
  },
  {
    id: "2022-qf-cro-bra", year: 2022, stage: "Quarter-final",
    home: "Croatia", away: "Brazil", homeScore: 1, awayScore: 1, note: "Pen 4-2",
    queries: [
      "Neymar scored a stunning extra-time goal for Brazil vs Croatia — show the dribble route and defensive positions when he beat the keeper.",
      "Croatia equalized through Bruno Petković at 1-1 in extra time. Was there a VAR offside check on the goal?",
    ],
  },
  {
    id: "2022-r16-arg-aus", year: 2022, stage: "Round of 16",
    home: "Argentina", away: "Australia", homeScore: 2, awayScore: 1,
    queries: [
      "Lionel Messi opened the scoring vs Australia with a right-foot finish. Show the build-up positions and the offside line at the moment of his run.",
      "Australia pulled one back late — show the defensive error in Argentina's high line that led to the goal.",
    ],
  },
  {
    id: "2022-r16-fra-pol", year: 2022, stage: "Round of 16",
    home: "France", away: "Poland", homeScore: 3, awayScore: 1,
    queries: [
      "Mbappé scored twice vs Poland — show his second goal positions and explain why it was not offside despite the tight line.",
      "Giroud's goal gave France a 2-0 lead. Show the penalty area positions and the VAR check.",
    ],
  },
  {
    id: "2022-r16-bra-kor", year: 2022, stage: "Round of 16",
    home: "Brazil", away: "South Korea", homeScore: 4, awayScore: 1,
    queries: [
      "Brazil scored four first-half goals vs South Korea. Show Vinicius Jr's position for the opening goal — was he onside?",
      "Richarlison scored a bicycle kick in this match. Show the build-up player positions for that goal.",
    ],
  },
  {
    id: "2022-grp-arg-sau", year: 2022, stage: "Group Stage",
    home: "Argentina", away: "Saudi Arabia", homeScore: 1, awayScore: 2,
    queries: [
      "Argentina had three first-half goals disallowed by VAR for offside vs Saudi Arabia. Show the offside lines for Lautaro Martínez's disallowed goals.",
      "Saudi Arabia scored twice in 5 minutes to win 2-1 — show the high defensive line Argentina played and the two goals that punished it.",
    ],
  },

  // ── 2018 Russia ─────────────────────────────────────
  {
    id: "2018-final", year: 2018, stage: "Final",
    home: "France", away: "Croatia", homeScore: 4, awayScore: 2,
    queries: [
      "France's second goal in the 2018 Final was awarded as an own goal after Griezmann's free kick deflected in — how did VAR rule on this?",
      "Antoine Griezmann was awarded a penalty in the 2018 Final for handball by Perišić. Show the hand position and explain the VAR handball protocol.",
      "Show Croatia's comeback to 2-1 — Perišić's volleyed equalizer — and the defensive positions France held.",
    ],
  },
  {
    id: "2018-sf1", year: 2018, stage: "Semi-final",
    home: "France", away: "Belgium", homeScore: 1, awayScore: 0,
    queries: [
      "Samuel Umtiti's header from a corner won the 2018 semi-final for France. Show the corner positions and Belgium's zonal marking.",
      "Analyse France's defensive counter-attacking 4-4-2 block that neutralised Belgium's attack in the semi-final.",
    ],
  },
  {
    id: "2018-r16-arg-fra", year: 2018, stage: "Round of 16",
    home: "Argentina", away: "France", homeScore: 3, awayScore: 4,
    queries: [
      "Benjamin Pavard scored a stunning volley for France in the Round of 16 — show the positions and explain why the offside check passed.",
      "Mbappé scored twice in quick succession for France — show the positions for each goal and the VAR offside lines used.",
      "Argentina were awarded a penalty after Rojo was fouled — show the box positions and the VAR review process.",
    ],
  },
  {
    id: "2018-r16-esp-rus", year: 2018, stage: "Round of 16",
    home: "Spain", away: "Russia", homeScore: 1, awayScore: 1, note: "Pen 3-4",
    queries: [
      "Spain dominated possession but Russia held out — show Spain's tiki-taka build-up and why Russia's low block was effective.",
      "Russia's equalizer against Spain came from a corner. Show the set-piece positions and the VAR check.",
    ],
  },

  // ── 2014 Brazil ─────────────────────────────────────
  {
    id: "2014-final", year: 2014, stage: "Final",
    home: "Germany", away: "Argentina", homeScore: 1, awayScore: 0, note: "AET",
    queries: [
      "Götze scored the winner for Germany vs Argentina in extra time — show the positions of the cross and finish.",
      "Argentina had a late chance cleared off the line — show the goalmouth positions and the VAR check that would apply under modern rules.",
    ],
  },
  {
    id: "2014-sf1", year: 2014, stage: "Semi-final",
    home: "Brazil", away: "Germany", homeScore: 1, awayScore: 7,
    queries: [
      "Germany scored five goals in 18 minutes against Brazil. Show the defensive breakdown positions for Müller's first goal.",
      "Klose's goal made him the all-time World Cup top scorer — show the positions for his tap-in and the defensive line Brazil held.",
    ],
  },
  {
    id: "2014-qf-bra-col", year: 2014, stage: "Quarter-final",
    home: "Brazil", away: "Colombia", homeScore: 2, awayScore: 1,
    queries: [
      "James Rodríguez scored a consolation for Colombia vs Brazil. Show the defensive positions and his run.",
      "The foul on Neymar that ended his tournament — show the positions of Camilo Zúñiga's challenge and explain if VAR would have upgraded this to a red card.",
    ],
  },
]

export const YEARS = [...new Set(HISTORICAL_MATCHES.map(m => m.year))].sort((a, b) => b - a)
