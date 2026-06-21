export interface PlayerPosition {
  id: string;
  name: string;
  number: number;
  x: number; // percentage from left
  y: number; // percentage from top
  role: string;
}

export interface FormationState {
  team: 'Argentina' | 'France';
  formation: string;
  description: string;
  whyChanged: string;
  expectedBenefit: string;
  risk: string;
  players: PlayerPosition[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'var' | 'substitution' | 'tactical_shift' | 'match_start' | 'half_time' | 'full_time' | 'extra_time_start' | 'penalty_shootout';
  title: string;
  description: string;
  impactText: string;
  team?: 'Argentina' | 'France';
  player?: string;
  detailId?: string; // Links to VAR or tactical details
}

export interface VARDecision {
  id: string;
  minute: number;
  decision: string;
  originalCall: string;
  finalCall: string;
  ruleApplied: string;
  ruleTitle: string;
  ruleDescription: string;
  confidence: number;
  evidenceText: string;
  visualData: {
    freezeFrameTitle: string;
    offsideLineValue?: number; // Y-coordinate or offset
    outlines: { label: string; x: number; y: number; isOffside?: boolean; color: string }[];
    varLines: { type: 'offside' | 'goal-line' | 'foul'; coords: { x1: number; y1: number; x2: number; y2: number; color: string }[] };
  };
}

export interface MatchData {
  teams: {
    home: { name: string; score: number; logo: string };
    away: { name: string; score: number; logo: string };
  };
  events: MatchEvent[];
  momentum: { minute: number; value: number; explanation: string }[]; // positive: Argentina, negative: France
  predictions: { minute: number; homeWin: number; awayWin: number; draw: number; factors: string[] }[];
  formations: {
    [minute: number]: {
      home: FormationState;
      away: FormationState;
    };
  };
  varDecisions: VARDecision[];
}

export const matchData: MatchData = {
  teams: {
    home: { name: 'Argentina', score: 3, logo: '🇦🇷' },
    away: { name: 'France', score: 3, logo: '🇫🇷' }
  },
  events: [
    {
      minute: 0,
      type: 'match_start',
      title: 'Match Kickoff',
      description: 'The 2022 FIFA World Cup Final kicks off at the Lusail Stadium. Argentina starts in a flexible 4-3-3; France mirrors with a classic 4-3-3.',
      impactText: 'Match begins at 0-0. Argentina holds a slight tactical edge due to Di Maria starting on the left wing.',
    },
    {
      minute: 12,
      type: 'card',
      title: 'High Press Dominance',
      description: 'Argentina dominates possession. De Paul and Messi orchestrate attacks on the right, shifting France back.',
      impactText: 'Argentina momentum surges to +25%. France struggling to transition through Griezmann.',
      team: 'Argentina'
    },
    {
      minute: 21,
      type: 'var',
      title: 'Penalty Awarded to Argentina',
      description: 'Di Maria beats Dembele inside the box. Dembele trips Di Maria. Referee immediately points to the spot. VAR review confirms the contact.',
      impactText: 'Goal probability for Argentina spikes. France defenders under pressure.',
      team: 'Argentina',
      detailId: 'var-21'
    },
    {
      minute: 23,
      type: 'goal',
      title: 'Goal! Argentina 1 - 0 France',
      description: 'Lionel Messi coolly slots the penalty into the bottom right corner, sending Lloris the wrong way.',
      impactText: 'Argentina win probability increases to 68%. France forced to adjust defensive line.',
      team: 'Argentina',
      player: 'Lionel Messi'
    },
    {
      minute: 36,
      type: 'goal',
      title: 'Goal! Argentina 2 - 0 France',
      description: 'A breathtaking counter-attack. Messi flicks to Mac Allister, who squares a perfect pass to Angel Di Maria. Di Maria finishes over Lloris.',
      impactText: 'Argentina momentum peaks (+75%). Tactical superiority of Di Maria on the left wing confirmed.',
      team: 'Argentina',
      player: 'Angel Di Maria'
    },
    {
      minute: 41,
      type: 'tactical_shift',
      title: 'Tactical Shift: France Radical Substitution',
      description: 'Deschamps acts before half-time. Dembele and Giroud are substituted. Kolo Muani and Marcus Thuram enter. Mbappe moves to striker.',
      impactText: 'France shifts to a direct 4-2-4. High pressing sequence initiated. Defensive line pushed higher.',
      team: 'France',
      detailId: 'shift-41'
    },
    {
      minute: 45,
      type: 'half_time',
      title: 'Half Time: Argentina 2 - 0 France',
      description: 'Argentina in absolute control. France failed to register a single shot in the first half.',
      impactText: 'Argentina win probability: 82%. France needs Kolo Muani to disrupt Otamendi.',
    },
    {
      minute: 55,
      type: 'card',
      title: 'Rabiot Yellow Card',
      description: 'Adrien Rabiot receives a yellow card for a hard tackle on De Paul to stop a dangerous counter.',
      impactText: 'France midfield becomes less aggressive in challenges.',
      team: 'France',
      player: 'Adrien Rabiot'
    },
    {
      minute: 64,
      type: 'tactical_shift',
      title: 'Tactical Shift: Argentina Defensive Block',
      description: 'Scaloni substitutes Angel Di Maria. Marcos Acuna enters. Argentina drops into a structured 4-4-2 to protect the lead.',
      impactText: 'Argentina gives up winger width to secure central midfield. Risk: invites France pressure.',
      team: 'Argentina',
      detailId: 'shift-64'
    },
    {
      minute: 79,
      type: 'var',
      title: 'VAR Review: Penalty for France',
      description: 'Kolo Muani gets behind Otamendi. Otamendi pulls him down in the box. Referee awards a penalty. VAR confirms the decision.',
      impactText: 'France given a lifeline. Argentina momentum drops instantly.',
      team: 'France',
      detailId: 'var-79'
    },
    {
      minute: 80,
      type: 'goal',
      title: 'Goal! Argentina 2 - 1 France',
      description: 'Kylian Mbappe fires the penalty hard into the bottom-right corner. Martinez gets a hand to it but cannot stop it.',
      impactText: 'France win probability rises to 28%. Tension rises.',
      team: 'France',
      player: 'Kylian Mbappe'
    },
    {
      minute: 81,
      type: 'goal',
      title: 'Goal! Argentina 2 - 2 France',
      description: 'Sensational! Rabiot lofts to Mbappe, who plays a neat one-two with Thuram and hits a thunderous volley into the far corner.',
      impactText: 'Momentum swings entirely to France (-80%). Game is leveled in 97 seconds.',
      team: 'France',
      player: 'Kylian Mbappe'
    },
    {
      minute: 90,
      type: 'full_time',
      title: 'Full Time: Argentina 2 - 2 France',
      description: 'A chaotic end to normal time. Messi nearly wins it with a long-range shot, saved by Lloris. We go to Extra Time.',
      impactText: 'Win probability equalized. France has physical advantage; Argentina has mental exhaustion.',
    },
    {
      minute: 102,
      type: 'tactical_shift',
      title: 'Tactical Shift: Argentina 5-3-2 in Extra Time',
      description: 'Paredes and Lautaro Martinez enter. Scaloni shifts to a 5-3-2 back three to counter France\'s high crosses and pace.',
      impactText: 'Argentina re-establishes defensive solidity. Wide wingbacks provide outlet.',
      team: 'Argentina',
      detailId: 'shift-102'
    },
    {
      minute: 108,
      type: 'var',
      title: 'VAR Goal Decision: Messi Scores!',
      description: 'Lautaro Martinez shot is saved. Messi taps in the rebound. Upamecano clears it from inside the goal. VAR checks for offside and goal-line crossing.',
      impactText: 'Goal stands! Argentina takes the lead. Win probability jumps to 78%.',
      team: 'Argentina',
      player: 'Lionel Messi',
      detailId: 'var-108'
    },
    {
      minute: 116,
      type: 'var',
      title: 'VAR Review: Penalty for France',
      description: 'Mbappe shot hits Montiel\'s arm in the box. Referee awards a penalty. VAR confirms the handball block.',
      impactText: 'Late drama. France win probability spikes back up.',
      team: 'France',
      detailId: 'var-116'
    },
    {
      minute: 118,
      type: 'goal',
      title: 'Goal! Argentina 3 - 3 France',
      description: 'Kylian Mbappe completes his hat-trick, slotting the penalty coolly to Martinez\'s left.',
      impactText: 'Mbappe becomes second player to score World Cup Final hat-trick.',
      team: 'France',
      player: 'Kylian Mbappe'
    },
    {
      minute: 120,
      type: 'full_time',
      title: 'End of Extra Time: 3 - 3',
      description: 'Unbelievable save! Kolo Muani clean through, but Martinez makes a legendary leg save. Penalties will decide the World Cup.',
      impactText: 'One of the greatest matches in sports history goes to a penalty shootout.',
    }
  ],
  momentum: [
    { minute: 0, value: 0, explanation: 'Teams sizing each other up. Formations neutral.' },
    { minute: 5, value: 10, explanation: 'Argentina controls midfield tempo. Enzo Fernandez dictating.' },
    { minute: 10, value: 25, explanation: 'Di Maria overloading France\'s right side. Dembele tracking back deep.' },
    { minute: 15, value: 30, explanation: 'Argentina completed 28 passes in the attacking third. France pinned back.' },
    { minute: 20, value: 35, explanation: 'Argentina pressure leads to penalty incident. France defensive line disorganized.' },
    { minute: 23, value: 50, explanation: 'Messi penalty goal. Argentina dominates possession (64%).' },
    { minute: 30, value: 45, explanation: 'France attempts to press higher but leaves space in midfield.' },
    { minute: 36, value: 75, explanation: 'Di Maria counter-attack goal. Tactical wing overload pays off.' },
    { minute: 41, value: 40, explanation: 'France double substitution. Dembele out reduces defensive errors on the wing.' },
    { minute: 45, value: 45, explanation: 'Half-time stats show Argentina 6 shots, France 0.' },
    { minute: 50, value: 35, explanation: 'France starts second half with more physical intensity in pressing.' },
    { minute: 60, value: 30, explanation: 'Argentina maintaining shape. De Paul breaking up counter attacks.' },
    { minute: 64, value: 10, explanation: 'Di Maria substituted. Argentina adopts defensive 4-4-2, relinquishing attacking width.' },
    { minute: 70, value: -15, explanation: 'France enjoys 58% possession in last 10 minutes. Pressure building on Argentina CBs.' },
    { minute: 75, value: -25, explanation: 'Kolo Muani speed testing Otamendi. Argentina drop deeper.' },
    { minute: 79, value: -45, explanation: 'Otamendi concedes penalty under heavy press from Kolo Muani.' },
    { minute: 80, value: -50, explanation: 'Mbappe converts penalty. Momentum shifts strongly to France.' },
    { minute: 81, value: -85, explanation: 'Mbappe volley goal! Chaotic shift, Argentina shellshocked. France completed 4 progressive passes in 10s.' },
    { minute: 85, value: -60, explanation: 'France pushing for winner. Thuram penalty shout turned down.' },
    { minute: 90, value: -20, explanation: 'Messi shot saved. Argentina recovers composure as normal time ends.' },
    { minute: 95, value: 5, explanation: 'Extra time begins. Scaloni resets team shape. Possession stabilizes.' },
    { minute: 100, value: 15, explanation: 'Messi orchestrating central attacks. Lautaro Martinez adding fresh energy.' },
    { minute: 102, value: 20, explanation: 'Argentina shifts to 5-3-2. Increased protection against France\'s wing crosses.' },
    { minute: 108, value: 55, explanation: 'Messi scores rebound goal. VAR check confirms onside and goal crossing.' },
    { minute: 112, value: 35, explanation: 'Argentina defends deep. France launching long balls to Kolo Muani.' },
    { minute: 116, value: -30, explanation: 'Mbappe shot hits Montiel\'s arm. France penalty awarded.' },
    { minute: 118, value: -45, explanation: 'Mbappe hat-trick. Game leveled.' },
    { minute: 120, value: -50, explanation: 'Martinez saves Kolo Muani 1-on-1. Extreme drama.' }
  ],
  predictions: [
    { minute: 0, homeWin: 38, awayWin: 34, draw: 28, factors: ['Argentina: Better form', 'France: Missing Upamecano starting', 'Even midfield strength'] },
    { minute: 15, homeWin: 48, awayWin: 24, draw: 28, factors: ['Argentina: 70% midfield control', 'France: No shots registered'] },
    { minute: 23, homeWin: 65, awayWin: 12, draw: 23, factors: ['Argentina: 1-0 lead (Messi)', 'France: Low press efficiency'] },
    { minute: 36, homeWin: 85, awayWin: 3, draw: 12, factors: ['Argentina: 2-0 lead (Di Maria)', 'France: Overloaded right flank'] },
    { minute: 45, homeWin: 88, awayWin: 2, draw: 10, factors: ['Argentina: Defensive structure stable', 'France: 0 shots at HT'] },
    { minute: 64, homeWin: 82, awayWin: 4, draw: 14, factors: ['Argentina: Di Maria out (defensive shift)', 'France: Increasing possession'] },
    { minute: 75, homeWin: 75, awayWin: 8, draw: 17, factors: ['France: High press success', 'Argentina: Midfield fatigue'] },
    { minute: 80, homeWin: 52, awayWin: 18, draw: 30, factors: ['France: 2-1 (Mbappe penalty)', 'Argentina: Defensive panic'] },
    { minute: 81, homeWin: 28, awayWin: 38, draw: 34, factors: ['France: 2-2 (Mbappe volley)', 'Argentina: Lost midfield grip'] },
    { minute: 90, homeWin: 33, awayWin: 33, draw: 34, factors: ['Draw: Match enters Extra Time', 'Physical fatigue on both sides'] },
    { minute: 102, homeWin: 45, awayWin: 28, draw: 27, factors: ['Argentina: Shift to 5-3-2 (solidified)', 'France: Midfield gaps opening'] },
    { minute: 108, homeWin: 80, awayWin: 5, draw: 15, factors: ['Argentina: 3-2 lead (Messi goal)', 'France: High defensive line failed'] },
    { minute: 118, homeWin: 10, awayWin: 10, draw: 80, factors: ['France: 3-3 (Mbappe hat-trick)', 'Draw: Shootout highly probable'] },
    { minute: 120, homeWin: 50, awayWin: 50, draw: 0, factors: ['Shootout: Even 50-50 chances'] }
  ],
  formations: {
    0: {
      home: {
        team: 'Argentina',
        formation: '4-3-3',
        description: 'Attacking 4-3-3 with Di Maria wide left stretching France\'s defense, and Messi drifting inside from the right.',
        whyChanged: 'Starting formation designed to exploit space behind France\'s offensive fullbacks.',
        expectedBenefit: 'Overload in midfield and isolation of France\'s right-back Kounde.',
        risk: 'Leaves space behind wingers if France counters quickly through Mbappe.',
        players: [
          { id: 'arg-gk', name: 'Martinez', number: 23, x: 50, y: 92, role: 'GK' },
          { id: 'arg-rb', name: 'Molina', number: 26, x: 15, y: 76, role: 'DF' },
          { id: 'arg-rcb', name: 'Romero', number: 13, x: 38, y: 81, role: 'DF' },
          { id: 'arg-lcb', name: 'Otamendi', number: 19, x: 62, y: 81, role: 'DF' },
          { id: 'arg-lb', name: 'Tagliafico', number: 3, x: 85, y: 76, role: 'DF' },
          { id: 'arg-rcm', name: 'De Paul', number: 7, x: 32, y: 60, role: 'MF' },
          { id: 'arg-dm', name: 'Enzo', number: 24, x: 50, y: 65, role: 'MF' },
          { id: 'arg-lcm', name: 'Mac Allister', number: 20, x: 68, y: 60, role: 'MF' },
          { id: 'arg-rw', name: 'Messi', number: 10, x: 22, y: 38, role: 'FW' },
          { id: 'arg-st', name: 'Alvarez', number: 9, x: 50, y: 32, role: 'FW' },
          { id: 'arg-lw', name: 'Di Maria', number: 11, x: 78, y: 38, role: 'FW' }
        ]
      },
      away: {
        team: 'France',
        formation: '4-3-3',
        description: 'Standard 4-3-3 with Giroud as target man, Mbappe running from the left, and Dembele wide right.',
        whyChanged: 'Default tournament shape for France under Deschamps.',
        expectedBenefit: 'Direct wing transitions to Mbappe with Griezmann linking midfield and attack.',
        risk: 'Midfield pivot (Tchouameni) can be overloaded by Argentina\'s midfield three.',
        players: [
          { id: 'fra-gk', name: 'Lloris', number: 1, x: 50, y: 8, role: 'GK' },
          { id: 'fra-lb', name: 'T. Hernandez', number: 22, x: 15, y: 24, role: 'DF' },
          { id: 'fra-lcb', name: 'Upamecano', number: 18, x: 38, y: 19, role: 'DF' },
          { id: 'fra-rcb', name: 'Varane', number: 4, x: 62, y: 19, role: 'DF' },
          { id: 'fra-rb', name: 'Kounde', number: 5, x: 85, y: 24, role: 'DF' },
          { id: 'fra-lcm', name: 'Rabiot', number: 14, x: 30, y: 40, role: 'MF' },
          { id: 'fra-dm', name: 'Tchouameni', number: 8, x: 50, y: 35, role: 'MF' },
          { id: 'fra-rcm', name: 'Griezmann', number: 7, x: 70, y: 40, role: 'MF' },
          { id: 'fra-lw', name: 'Mbappe', number: 10, x: 20, y: 58, role: 'FW' },
          { id: 'fra-st', name: 'Giroud', number: 9, x: 50, y: 64, role: 'FW' },
          { id: 'fra-rw', name: 'Dembele', number: 11, x: 80, y: 58, role: 'FW' }
        ]
      }
    },
    41: {
      home: {
        team: 'Argentina',
        formation: '4-3-3',
        description: 'Attacking 4-3-3, maintaining control. Midfielders De Paul and Mac Allister dropping slightly deeper to deny France counters.',
        whyChanged: 'Unchanged, as tactics are highly effective.',
        expectedBenefit: 'Conserve energy and sustain pressure.',
        risk: 'Over-reliance on high-intensity pressing could cause fatigue in second half.',
        players: [
          { id: 'arg-gk', name: 'Martinez', number: 23, x: 50, y: 92, role: 'GK' },
          { id: 'arg-rb', name: 'Molina', number: 26, x: 15, y: 76, role: 'DF' },
          { id: 'arg-rcb', name: 'Romero', number: 13, x: 38, y: 81, role: 'DF' },
          { id: 'arg-lcb', name: 'Otamendi', number: 19, x: 62, y: 81, role: 'DF' },
          { id: 'arg-lb', name: 'Tagliafico', number: 3, x: 85, y: 76, role: 'DF' },
          { id: 'arg-rcm', name: 'De Paul', number: 7, x: 34, y: 63, role: 'MF' },
          { id: 'arg-dm', name: 'Enzo', number: 24, x: 50, y: 68, role: 'MF' },
          { id: 'arg-lcm', name: 'Mac Allister', number: 20, x: 66, y: 63, role: 'MF' },
          { id: 'arg-rw', name: 'Messi', number: 10, x: 28, y: 44, role: 'FW' },
          { id: 'arg-st', name: 'Alvarez', number: 9, x: 50, y: 35, role: 'FW' },
          { id: 'arg-lw', name: 'Di Maria', number: 11, x: 74, y: 44, role: 'FW' }
        ]
      },
      away: {
        team: 'France',
        formation: '4-2-4',
        description: 'Hyper-offensive 4-2-4. Giroud & Dembele off. Muani & Thuram on as direct, physical wingers. Mbappe shifts central next to Muani.',
        whyChanged: 'France had 0 shots and were completely locked out in midfield. Needed directness and physicality.',
        expectedBenefit: 'Unpredictable, direct running to bypass Argentina\'s central midfield press.',
        risk: 'Only two central midfielders (Rabiot, Tchouameni) leaving massive gaps in the center.',
        players: [
          { id: 'fra-gk', name: 'Lloris', number: 1, x: 50, y: 8, role: 'GK' },
          { id: 'fra-lb', name: 'T. Hernandez', number: 22, x: 15, y: 24, role: 'DF' },
          { id: 'fra-lcb', name: 'Upamecano', number: 18, x: 38, y: 19, role: 'DF' },
          { id: 'fra-rcb', name: 'Varane', number: 4, x: 62, y: 19, role: 'DF' },
          { id: 'fra-rb', name: 'Kounde', number: 5, x: 85, y: 24, role: 'DF' },
          { id: 'fra-lcm', name: 'Rabiot', number: 14, x: 35, y: 42, role: 'MF' },
          { id: 'fra-rcm', name: 'Tchouameni', number: 8, x: 65, y: 42, role: 'MF' },
          { id: 'fra-lw', name: 'Thuram', number: 26, x: 15, y: 60, role: 'FW' },
          { id: 'fra-lst', name: 'Mbappe', number: 10, x: 38, y: 68, role: 'FW' },
          { id: 'fra-rst', name: 'Kolo Muani', number: 12, x: 62, y: 68, role: 'FW' },
          { id: 'fra-rw', name: 'Coman', number: 20, x: 85, y: 60, role: 'FW' }
        ]
      }
    },
    64: {
      home: {
        team: 'Argentina',
        formation: '4-4-2',
        description: 'Defensive 4-4-2. Angel Di Maria subbed off for fullback/winger Marcos Acuna. Team shifts to narrow midfield block.',
        whyChanged: 'Protect the 2-0 lead. Block France\'s winger progression by doubling up on flanks.',
        expectedBenefit: 'Greater defensive cover on wings, tighter midfield lines to deny Mbappe space.',
        risk: 'Losing all counter-attacking outlet on the left; invites France to overload.',
        players: [
          { id: 'arg-gk', name: 'Martinez', number: 23, x: 50, y: 92, role: 'GK' },
          { id: 'arg-rb', name: 'Molina', number: 26, x: 15, y: 78, role: 'DF' },
          { id: 'arg-rcb', name: 'Romero', number: 13, x: 38, y: 82, role: 'DF' },
          { id: 'arg-lcb', name: 'Otamendi', number: 19, x: 62, y: 82, role: 'DF' },
          { id: 'arg-lb', name: 'Tagliafico', number: 3, x: 85, y: 78, role: 'DF' },
          { id: 'arg-rm', name: 'De Paul', number: 7, x: 20, y: 58, role: 'MF' },
          { id: 'arg-rcm', name: 'Enzo', number: 24, x: 40, y: 62, role: 'MF' },
          { id: 'arg-lcm', name: 'Mac Allister', number: 20, x: 60, y: 62, role: 'MF' },
          { id: 'arg-lm', name: 'Acuna', number: 8, x: 80, y: 58, role: 'MF' },
          { id: 'arg-rst', name: 'Messi', number: 10, x: 40, y: 40, role: 'FW' },
          { id: 'arg-lst', name: 'Alvarez', number: 9, x: 60, y: 40, role: 'FW' }
        ]
      },
      away: {
        team: 'France',
        formation: '4-2-4',
        description: 'Direct 4-2-4 with high fullbacks. Griezmann substituted at 71\' for Camavinga (playing left-back but pushing inside), Coman on right.',
        whyChanged: 'Increase crossing frequency and physical aerial presence.',
        expectedBenefit: 'Create numerical overloads on the wings against Argentina\'s fullbacks.',
        risk: 'Susceptible to Messi orchestrating direct central counters.',
        players: [
          { id: 'fra-gk', name: 'Lloris', number: 1, x: 50, y: 8, role: 'GK' },
          { id: 'fra-lb', name: 'Camavinga', number: 25, x: 15, y: 28, role: 'DF' },
          { id: 'fra-lcb', name: 'Upamecano', number: 18, x: 38, y: 19, role: 'DF' },
          { id: 'fra-rcb', name: 'Varane', number: 4, x: 62, y: 19, role: 'DF' },
          { id: 'fra-rb', name: 'Kounde', number: 5, x: 85, y: 24, role: 'DF' },
          { id: 'fra-lcm', name: 'Rabiot', number: 14, x: 38, y: 44, role: 'MF' },
          { id: 'fra-rcm', name: 'Tchouameni', number: 8, x: 62, y: 44, role: 'MF' },
          { id: 'fra-lw', name: 'Thuram', number: 26, x: 18, y: 62, role: 'FW' },
          { id: 'fra-lst', name: 'Mbappe', number: 10, x: 38, y: 70, role: 'FW' },
          { id: 'fra-rst', name: 'Kolo Muani', number: 12, x: 62, y: 70, role: 'FW' },
          { id: 'fra-rw', name: 'Coman', number: 20, x: 82, y: 62, role: 'FW' }
        ]
      }
    },
    102: {
      home: {
        team: 'Argentina',
        formation: '5-3-2',
        description: 'Extra Time 5-3-2. Gonzalo Montiel & Leandro Paredes enter, Lautaro Martinez replaces Alvarez. Shifting to deep three CB block.',
        whyChanged: 'Mbappe was finding space on the wings and Kolo Muani was winning long balls. Needed third center back (Pezzella) to secure box.',
        expectedBenefit: 'Extreme box protection, wingbacks (Molina, Acuna) can press high without leaving CBs exposed.',
        risk: 'Very deep block makes it hard to sustain possession in France\'s half.',
        players: [
          { id: 'arg-gk', name: 'Martinez', number: 23, x: 50, y: 92, role: 'GK' },
          { id: 'arg-rwb', name: 'Montiel', number: 4, x: 12, y: 72, role: 'DF' },
          { id: 'arg-rcb', name: 'Romero', number: 13, x: 30, y: 82, role: 'DF' },
          { id: 'arg-cb', name: 'Pezzella', number: 6, x: 50, y: 84, role: 'DF' },
          { id: 'arg-lcb', name: 'Otamendi', number: 19, x: 70, y: 82, role: 'DF' },
          { id: 'arg-lwb', name: 'Acuna', number: 8, x: 88, y: 72, role: 'DF' },
          { id: 'arg-rcm', name: 'De Paul', number: 7, x: 30, y: 58, role: 'MF' },
          { id: 'arg-dm', name: 'Paredes', number: 5, x: 50, y: 62, role: 'MF' },
          { id: 'arg-lcm', name: 'Enzo', number: 24, x: 70, y: 58, role: 'MF' },
          { id: 'arg-rst', name: 'Messi', number: 10, x: 40, y: 44, role: 'FW' },
          { id: 'arg-lst', name: 'Lautaro', number: 22, x: 60, y: 44, role: 'FW' }
        ]
      },
      away: {
        team: 'France',
        formation: '4-2-4',
        description: 'Direct 4-2-4 with Konate replacing injured Varane. Pushing wingers as high as possible to pin Argentina\'s 5-man line.',
        whyChanged: 'Maintain pressure in extra time. Counter Argentina\'s 5-man defense by stretching the defense horizontally.',
        expectedBenefit: 'Isolate individual defenders in 1v1 situations inside the box.',
        risk: 'Tired central midfielders (Fofana, Tchouameni) vulnerable to counters by Enzo and Messi.',
        players: [
          { id: 'fra-gk', name: 'Lloris', number: 1, x: 50, y: 8, role: 'GK' },
          { id: 'fra-lb', name: 'Camavinga', number: 25, x: 15, y: 28, role: 'DF' },
          { id: 'fra-lcb', name: 'Upamecano', number: 18, x: 38, y: 19, role: 'DF' },
          { id: 'fra-rcb', name: 'Konate', number: 24, x: 62, y: 19, role: 'DF' },
          { id: 'fra-rb', name: 'Kounde', number: 5, x: 85, y: 24, role: 'DF' },
          { id: 'fra-lcm', name: 'Fofana', number: 19, x: 36, y: 44, role: 'MF' },
          { id: 'fra-rcm', name: 'Tchouameni', number: 8, x: 64, y: 44, role: 'MF' },
          { id: 'fra-lw', name: 'Thuram', number: 26, x: 15, y: 64, role: 'FW' },
          { id: 'fra-lst', name: 'Mbappe', number: 10, x: 38, y: 72, role: 'FW' },
          { id: 'fra-rst', name: 'Kolo Muani', number: 12, x: 62, y: 72, role: 'FW' },
          { id: 'fra-rw', name: 'Coman', number: 20, x: 85, y: 64, role: 'FW' }
        ]
      }
    }
  },
  varDecisions: [
    {
      id: 'var-21',
      minute: 21,
      decision: 'PENALTY CONFIRMED',
      originalCall: 'Penalty Kick (On-field decision)',
      finalCall: 'Penalty Kick (Confirmed after silent check)',
      ruleApplied: 'FIFA Law 12 - Fouls and Misconduct',
      ruleTitle: 'Law 12: Careless trip inside the penalty area',
      ruleDescription: 'A direct free kick (or penalty) is awarded if a player commits a careless, reckless or excessively forceful tackle. Tripping or attempting to trip an opponent carelessy constitutes an infraction.',
      confidence: 96,
      evidenceText: 'High-speed freeze frame shows Ousmane Dembele placing his left knee and foot into the trailing leg of Angel Di Maria. Di Maria had established positioning inside the box. Contact occurred before Dembele reached the ball. No clear and obvious error detected by VAR.',
      visualData: {
        freezeFrameTitle: '21\' Penalty Check - Dembele vs Di Maria',
        outlines: [
          { label: 'Di Maria (ARG)', x: 42, y: 65, color: '#00D8F6' },
          { label: 'Dembele (FRA)', x: 45, y: 67, color: '#FF3860' }
        ],
        varLines: {
          type: 'foul',
          coords: [
            { x1: 42, y1: 72, x2: 45, y2: 72, color: '#FFD12C' } // contact point
          ]
        }
      }
    },
    {
      id: 'var-79',
      minute: 79,
      decision: 'PENALTY CONFIRMED',
      originalCall: 'Penalty Kick (On-field decision)',
      finalCall: 'Penalty Kick (Confirmed after check)',
      ruleApplied: 'FIFA Law 12 - Fouls and Misconduct',
      ruleTitle: 'Law 12: Holding/Pulling an opponent',
      ruleDescription: 'Holding or pulling an opponent that impedes their progress inside the box is penalized with a penalty kick.',
      confidence: 98,
      evidenceText: 'Otamendi caught out of position by Kolo Muani\'s pace. Otamendi places his arm across Kolo Muani\'s shoulder, pulling him back. Contact continues inside the penalty box. Referee awards penalty; VAR check confirms upper body pull occurs during active ball tracking.',
      visualData: {
        freezeFrameTitle: '79\' Penalty Check - Otamendi vs Kolo Muani',
        outlines: [
          { label: 'Kolo Muani (FRA)', x: 52, y: 78, color: '#FF3860' },
          { label: 'Otamendi (ARG)', x: 49, y: 76, color: '#00D8F6' }
        ],
        varLines: {
          type: 'foul',
          coords: [
            { x1: 49, y1: 76, x2: 52, y2: 78, color: '#FF3860' } // pull coordinate
          ]
        }
      }
    },
    {
      id: 'var-108',
      minute: 108,
      decision: 'GOAL ALLOWED & ONSIDE CONFIRMED',
      originalCall: 'Goal (Assistant referee flagged offside initially, but ref pointed to goal)',
      finalCall: 'Goal Awarded (Semi-automated offside + Goal line tech)',
      ruleApplied: 'FIFA Law 11 (Offside) & Law 10 (Goal line crossing)',
      ruleTitle: 'Law 11: Offside Position; Law 10: Determining the outcome of a match',
      ruleDescription: 'A player is in an offside position if they are nearer to the opponents\' goal line than both the ball and the second-last opponent. A goal is scored when the whole of the ball passes over the goal line.',
      confidence: 99,
      evidenceText: 'VAR review checked two aspects: 1. Lautaro Martinez\'s position during the initial pass (confirmed onside by 0.12m, with Varane\'s heel keeping him onside). 2. Ball crossing the line: goal-line technology sensor triggered showing the entire ball crossed the line by 0.23m before Upamecano cleared it.',
      visualData: {
        freezeFrameTitle: '108\' Goal Check - Martinez Position & Goal Line',
        offsideLineValue: 42, // representing the vertical offside line
        outlines: [
          { label: 'Martinez (ARG)', x: 40, y: 45, isOffside: false, color: '#00D8F6' },
          { label: 'Varane (FRA)', x: 43, y: 44, color: '#FF3860' }, // last defender heel
          { label: 'Ball (Crossed)', x: 50, y: 6, color: '#FFD12C' }
        ],
        varLines: {
          type: 'offside',
          coords: [
            { x1: 43, y1: 0, x2: 43, y2: 100, color: '#00D8F6' }, // Offside Line (Varane heel)
            { x1: 40, y1: 0, x2: 40, y2: 100, color: '#FF3860' }  // Attacker Line (Martinez shoulder)
          ]
        }
      }
    },
    {
      id: 'var-116',
      minute: 116,
      decision: 'PENALTY CONFIRMED',
      originalCall: 'Penalty Kick (On-field decision)',
      finalCall: 'Penalty Kick (Confirmed after review)',
      ruleApplied: 'FIFA Law 12 - Handball',
      ruleTitle: 'Law 12: Handling the ball',
      ruleDescription: 'It is an offence if a player touches the ball with their hand/arm when it has made their body unnaturally bigger. Having the arm extended away from the body block is a penalty.',
      confidence: 94,
      evidenceText: 'Kylian Mbappe\'s shot from the edge of the box strikes Gonzalo Montiel\'s elbow. Montiel was jumping and turning, but his arm was extended, increasing his body silhouette and blocking a shot on target. On-field penalty decision is verified.',
      visualData: {
        freezeFrameTitle: '116\' Handball Check - Montiel Elbow Block',
        outlines: [
          { label: 'Montiel (ARG)', x: 48, y: 55, color: '#00D8F6' },
          { label: 'Mbappe (FRA)', x: 62, y: 58, color: '#FF3860' }
        ],
        varLines: {
          type: 'foul',
          coords: [
            { x1: 48, y1: 52, x2: 48, y2: 56, color: '#FFD12C' } // block point
          ]
        }
      }
    }
  ]
};
