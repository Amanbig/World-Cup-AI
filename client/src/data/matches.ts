import type { MatchEventDef } from '../types'

export interface HistoricalMatch {
  id: string
  year: number
  stage: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  note?: string
  queries: string[]
  events: MatchEventDef[]
}

export const HISTORICAL_MATCHES: HistoricalMatch[] = [
  {
    id: "2022-final", year: 2022, stage: "Final",
    home: "Argentina", away: "France", homeScore: 3, awayScore: 3, note: "AET · Pen 4-2",
    queries: [
      "France's penalty in the 80th minute for a handball by Montiel — was VAR correct to award it?",
      "Mbappé scored a hat-trick in the Final. Were any goals checked for offside?",
      "Show Argentina's third goal in extra time — Messi's close-range finish.",
    ],
    events: [
      {
        id: "2022-final-e1", minute: 22, type: "corner", team: "away", player: "Griezmann",
        description: "Corner France",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 22nd minute, 0-0. France earn a corner kick on the right side attacking Argentina's goal. Show 2 frames: Frame 1 'Corner Setup' — Griezmann at the bottom-right corner flag, Giroud making a near-post run, Mbappé positioned at the far post, Tchouaméni arriving from outside the box; Argentina's Otamendi, Romero, Molina, Acuña in defensive marking positions in the box; GK Emiliano Martínez on his line. Frame 2 'Ball Delivered' — Griezmann whips the cross in, Giroud and Otamendi contest in the air near the six-yard box. Home=Argentina defends bottom goal, Away=France attacks bottom goal.",
      },
      {
        id: "2022-final-e2", minute: 23, type: "goal", team: "home", player: "Di María",
        description: "⚽ Di María",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 23rd minute, 0-0. Argentina score through Di María after a brilliant build-up move. Show 2 frames: Frame 1 'Through Ball' — Mac Allister receives in midfield and plays a through ball into the channel; Di María makes a diagonal run in behind the French defensive line from the left side, beating Varane; French defenders Varane and Theo Hernandez caught high. Frame 2 'One-on-One' — Di María rounds GK Lloris and slots the ball low into the bottom corner from just inside the box; Argentina lead 1-0. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e3", minute: 36, type: "penalty", team: "home", player: "Messi",
        description: "⚡ Messi pen",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 36th minute, Argentina lead 1-0. Messi scores a penalty after Dembélé fouled Mac Allister in the box. Show 2 frames: Frame 1 'Foul in Box' — Mac Allister drives into the penalty area, Dembélé lunges and brings him down; incident_point at the contact spot inside the box. Frame 2 'Penalty Taken' — Messi steps up from the spot, shoots low to the right; Lloris dives left, ball goes right. Argentina 2-0. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e4", minute: 79, type: "corner", team: "away", player: "Griezmann",
        description: "Corner France",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 79th minute, Argentina lead 2-0. France earn a corner kick on the left side. Show 2 frames: Frame 1 'Corner Setup' — Griezmann at the bottom-left corner flag; Mbappé and Giroud make runs into the box, Tchouaméni at the edge; Argentina in zonal defence — Otamendi at the near post, Romero at far post, Molina man-marking; GK Martínez commanding his box. Frame 2 'Ball In' — corner whipped in low towards the near post; Mbappé flicks at it; defenders try to clear. Home=Argentina defends bottom goal, Away=France.",
      },
      {
        id: "2022-final-e5", minute: 80, type: "var", team: "away",
        description: "📺 VAR Handball",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 80th minute, Argentina leading 2-0. VAR review: Gonzalo Montiel's arm blocks Mbappé's cross in Argentina's penalty area. Show 2 frames: Frame 1 'Cross Delivered' — Mbappé receives on the right wing and whips a low cross into the box; Argentina's Montiel positioned in the penalty area with his arm out; France players Giroud and Thuram making runs. Frame 2 'VAR Check' — ball strikes Montiel's outstretched arm (incident_point at contact); VAR recommends penalty review; referee checks monitor and awards penalty. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e6", minute: 80, type: "penalty", team: "away", player: "Mbappé",
        description: "⚡ Mbappé pen",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 80th minute, Argentina 2-0 France. Mbappé scores a penalty after VAR awarded a handball. Show 2 frames: Frame 1 'Penalty Setup' — Mbappé places the ball on the penalty spot in France's attacking half (the bottom penalty area); Emiliano Martínez sets himself on the goal line; Argentina's outfield players waiting outside the box. Frame 2 'Penalty Scored' — Mbappé drives the ball powerfully to the right; Martínez dives left; goal 2-1. incident_point at the penalty spot. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e7", minute: 81, type: "goal", team: "away", player: "Mbappé",
        description: "⚽ Mbappé volley",
        prompt: "2022 World Cup Final (Home=Argentina, Away=France). 81st minute, Argentina 2-1 France. Mbappé scores an extraordinary left-foot volley to equalize at 2-2. Show 2 frames: Frame 1 'Ball Played In' — Thuram plays the ball across from the left channel into the box; Mbappé arrives at pace from outside the penalty area. Frame 2 'Volley' — Mbappé strikes a left-foot volley from around 18 yards; ball hits the underside of the crossbar and goes in; Martínez wrong-footed. incident_point at the strike position. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e8", minute: 108, type: "goal", team: "home", player: "Messi",
        description: "⚽ Messi AET",
        prompt: "2022 World Cup Final AET (Home=Argentina, Away=France). 108th minute, 2-2 after 90 minutes. Messi scores from close range in extra time to make it 3-2. Show 2 frames: Frame 1 'Scramble' — Lautaro Martínez shoots from inside the box; Lloris saves but parries the ball into a dangerous area; Messi follows up at close range. Frame 2 'Goal' — Messi pokes the ball home from inside the six-yard box; Argentina 3-2 in extra time; Lloris beaten. Home=Argentina, Away=France.",
      },
      {
        id: "2022-final-e9", minute: 118, type: "penalty", team: "away", player: "Mbappé",
        description: "⚽ Mbappé hat-trick",
        prompt: "2022 World Cup Final AET (Home=Argentina, Away=France). 118th minute, Argentina 3-2 France. Mbappé scores a penalty for his hat-trick to equalize 3-3 and force a shootout. Show 2 frames: Frame 1 'Penalty Awarded' — Kolo Muani enters the box and is brought down by Montiel; incident_point at the contact spot; referee points to the spot. Frame 2 'Hat-trick Penalty' — Mbappé rolls the ball to the left; Martínez goes right; Mbappé completes his hat-trick. 3-3 AET. incident_point at penalty spot. Home=Argentina, Away=France.",
      },
    ],
  },
  {
    id: "2022-sf1", year: 2022, stage: "Semi-final",
    home: "Argentina", away: "Croatia", homeScore: 3, awayScore: 0,
    queries: [
      "Argentina were awarded a penalty vs Croatia in the 34th minute after Livakovic brought down Álvarez — was it inside the box?",
      "Show how Julián Álvarez dribbled past the Croatian defence for his second goal.",
    ],
    events: [
      {
        id: "2022-sf1-e1", minute: 34, type: "penalty", team: "home", player: "Messi",
        description: "⚡ Messi pen",
        prompt: "2022 World Cup Semi-final (Home=Argentina, Away=Croatia). 34th minute, 0-0. Argentina win a penalty after Livakovic brings down Álvarez inside the box. Show 2 frames: Frame 1 'Foul' — Álvarez drives into the box; Livakovic comes out and fouls him just inside the penalty area; incident_point at contact spot. Frame 2 'Penalty' — Messi scores from the spot; Argentina 1-0. Home=Argentina, Away=Croatia.",
      },
      {
        id: "2022-sf1-e2", minute: 57, type: "goal", team: "home", player: "Álvarez",
        description: "⚽ Álvarez",
        prompt: "2022 World Cup Semi-final (Home=Argentina, Away=Croatia). 57th minute, Argentina leading 1-0. Álvarez scores after a rebound to make it 2-0. Show 2 frames: Frame 1 'Shot saved' — Argentina attack down the right; Messi plays a through ball; Álvarez fires at goal; Livakovic parries. Frame 2 'Rebound goal' — Álvarez follows up and taps the rebound into the empty net from close range. Home=Argentina, Away=Croatia.",
      },
      {
        id: "2022-sf1-e3", minute: 69, type: "goal", team: "home", player: "Álvarez",
        description: "⚽ Álvarez solo",
        prompt: "2022 World Cup Semi-final (Home=Argentina, Away=Croatia). 69th minute, Argentina leading 2-0. Álvarez scores a stunning solo goal dribbling from the halfway line. Show 3 frames: Frame 1 'Start of run' — Álvarez receives near the centre circle at y≈55, begins driving forward; Modrić and Kovačić try to close. Frame 2 'Breaking through midfield' — Álvarez has burst past the Croatian midfield line; Gvardiol tracking him but struggling to keep pace; ball at y≈70. Frame 3 'Finish' — Álvarez cuts inside past Gvardiol and shoots left-footed past Livakovic from the edge of the six-yard box; Argentina 3-0. Home=Argentina, Away=Croatia.",
      },
    ],
  },
  {
    id: "2022-sf2", year: 2022, stage: "Semi-final",
    home: "France", away: "Morocco", homeScore: 2, awayScore: 0,
    queries: [
      "Analyse France's pressing trap that led to Theo Hernández's opening goal.",
      "Morocco defended a 4-3-3 low block — how did France finally break it down?",
    ],
    events: [
      {
        id: "2022-sf2-e1", minute: 5, type: "goal", team: "home", player: "T. Hernández",
        description: "⚽ T. Hernández",
        prompt: "2022 World Cup Semi-final (Home=France, Away=Morocco). 5th minute. France score an early goal through Theo Hernández after Morocco lose the ball high up the pitch. Show 2 frames: Frame 1 'France Press' — France press high in Morocco's defensive third; Sabiri loses the ball to Griezmann under pressure. Frame 2 'Counter & Finish' — France break quickly; Mbappé advances and plays left to Theo Hernández who volleys home left-footed from 8 yards. Morocco's high defensive line caught out. Home=France defends bottom goal, Away=Morocco defends top goal.",
      },
      {
        id: "2022-sf2-e2", minute: 79, type: "goal", team: "home", player: "Kolo Muani",
        description: "⚽ Kolo Muani",
        prompt: "2022 World Cup Semi-final (Home=France, Away=Morocco). 79th minute, France leading 1-0. Kolo Muani scores to make it 2-0. Show 2 frames: Frame 1 'Cross into box' — Mbappé drives down the left and delivers a low cross into Morocco's penalty area; Kolo Muani making a run into the six-yard box. Frame 2 'Finish' — Kolo Muani slides to convert the cross at close range; 2-0 to France. Home=France, Away=Morocco.",
      },
    ],
  },
  {
    id: "2022-qf-arg-ned", year: 2022, stage: "Quarter-final",
    home: "Argentina", away: "Netherlands", homeScore: 2, awayScore: 2, note: "Pen 4-3",
    queries: [
      "Weghorst headed a cross to make it 2-1 in the 83rd minute — show the free kick wall positions.",
      "Netherlands equalized in the 11th minute of stoppage time. Show the defensive wall positions and the VAR offside check.",
    ],
    events: [
      {
        id: "2022-qf-ane-e1", minute: 73, type: "goal", team: "home", player: "Molina",
        description: "⚽ Molina",
        prompt: "2022 World Cup Quarter-final (Home=Argentina, Away=Netherlands). 73rd minute, 0-0. Molina scores after a Messi through ball. Show 2 frames: Frame 1 'Messi assist' — Messi receives on the right half and plays a precise through ball to Molina's run behind the Dutch defence. Frame 2 'Finish' — Molina one-on-one with Noppert and slots home; Argentina 1-0. Home=Argentina, Away=Netherlands.",
      },
      {
        id: "2022-qf-ane-e2", minute: 83, type: "freekick", team: "away",
        description: "🎯 Free kick",
        prompt: "2022 World Cup Quarter-final (Home=Argentina, Away=Netherlands). 83rd minute, Argentina lead 2-0. Netherlands win a free kick from wide right. Show 2 frames: Frame 1 'Free kick Setup' — Blind prepares to cross from the right side; Argentina set up a defensive wall plus zonal markers in the box; Dutch attackers Weghorst, Blind making runs. Frame 2 'Delivery & Header' — Blind whips a cross to the far post; Weghorst rises above Acuña to head home; 2-1. Home=Argentina, Away=Netherlands.",
      },
      {
        id: "2022-qf-ane-e3", minute: 101, type: "freekick", team: "away",
        description: "🎯 Free kick 2-2",
        prompt: "2022 World Cup Quarter-final (Home=Argentina, Away=Netherlands). 101st minute (stoppage time), Argentina 2-1. Netherlands equalize from a set piece through Weghorst. Show 2 frames: Frame 1 'Tactical free kick Setup' — Netherlands set up a clever dummy-run free kick; two players stand over the ball; Koopmeiners makes a dummy run; Blind rolls the ball short to Koopmeiners. Frame 2 'Pass & Shot' — Koopmeiners plays the ball into the box; Weghorst makes a blindside run and turns to shoot from close range past Martinez; 2-2. Home=Argentina, Away=Netherlands.",
      },
    ],
  },
  {
    id: "2022-qf-fra-eng", year: 2022, stage: "Quarter-final",
    home: "France", away: "England", homeScore: 2, awayScore: 1,
    queries: [
      "England's penalty was awarded after Tchouaméni was judged to have pushed Saka — show the incident.",
      "Harry Kane missed his second penalty at 2-1. Show the penalty spot and goalkeeper position.",
    ],
    events: [
      {
        id: "2022-qf-fe-e1", minute: 17, type: "goal", team: "home", player: "Tchouaméni",
        description: "⚽ Tchouaméni",
        prompt: "2022 World Cup Quarter-final (Home=France, Away=England). 17th minute, 0-0. Tchouaméni scores a long-range strike to open the scoring. Show 2 frames: Frame 1 'Midfield build-up' — France recycle possession from a free kick; Tchouaméni receives the ball 25 yards from goal, England's midfield not closing quickly. Frame 2 'Long-range strike' — Tchouaméni drives a right-foot shot low to the right corner from outside the box; Pickford wrong-footed; 1-0 France. Home=France, Away=England.",
      },
      {
        id: "2022-qf-fe-e2", minute: 54, type: "penalty", team: "away", player: "Kane",
        description: "⚡ Kane pen 1-1",
        prompt: "2022 World Cup Quarter-final (Home=France, Away=England). 54th minute, France 1-0 England. England win a penalty after Tchouaméni fouls Saka in the box. Kane converts to equalize. Show 2 frames: Frame 1 'Foul in Box' — Saka makes a run into the French penalty area; Tchouaméni's challenge brings him down; incident_point at contact. Frame 2 'Penalty Scored' — Kane slots the penalty to Lloris' right; 1-1. Home=France, Away=England.",
      },
      {
        id: "2022-qf-fe-e3", minute: 78, type: "penalty", team: "away", player: "Kane",
        description: "⚡ Kane pen miss",
        prompt: "2022 World Cup Quarter-final (Home=France, Away=England). 78th minute, France 2-1 England. Kane steps up for England's second penalty to equalize. Show 2 frames: Frame 1 'Penalty run-up' — Kane approaches from the right; Lloris stays central guessing. Frame 2 'Miss' — Kane smashes the ball over the crossbar from the penalty spot; ball sails into the crowd; France survive and go through 2-1. incident_point at the penalty spot. Home=France, Away=England.",
      },
    ],
  },
  {
    id: "2022-qf-mar-por", year: 2022, stage: "Quarter-final",
    home: "Morocco", away: "Portugal", homeScore: 1, awayScore: 0,
    queries: [
      "Show the defensive formation Morocco used to shut out Portugal.",
      "En-Nesyri's headed winner — show the aerial duel and offside line check.",
    ],
    events: [
      {
        id: "2022-qf-mp-e1", minute: 42, type: "goal", team: "home", player: "En-Nesyri",
        description: "⚽ En-Nesyri",
        prompt: "2022 World Cup Quarter-final (Home=Morocco, Away=Portugal). 42nd minute, 0-0. En-Nesyri scores a spectacular headed winner for Morocco from a corner. Show 2 frames: Frame 1 'Corner delivery' — Ziyech takes the corner from the right side; En-Nesyri makes a run to the far post from outside; Portugal defenders positioned zonally but not tracking his run. Frame 2 'Aerial duel' — En-Nesyri rises highest at the far post, outjumping Diogo Costa and scores with a powerful downward header; Morocco 1-0. Show the offside line — En-Nesyri is clearly onside. Home=Morocco, Away=Portugal.",
      },
      {
        id: "2022-qf-mp-e2", minute: 60, type: "corner", team: "away", player: "Fernandes",
        description: "Corner Portugal",
        prompt: "2022 World Cup Quarter-final (Home=Morocco, Away=Portugal). 60th minute, Morocco lead 1-0. Portugal earn a corner kick as they push for an equalizer. Show 2 frames: Frame 1 'Corner Setup' — Bruno Fernandes to take the corner; Ronaldo, Pepe, Goncalo Ramos making runs into the box; Morocco defend with a mix of zonal and man-marking — Saiss, En-Nesyri, Hakimi covering key zones. Frame 2 'Delivery' — Fernandes swings the ball in; aerial contest develops in the six-yard box; Morocco GK Bono commands his area and claims the ball. Home=Morocco, Away=Portugal.",
      },
    ],
  },
  {
    id: "2022-qf-cro-bra", year: 2022, stage: "Quarter-final",
    home: "Croatia", away: "Brazil", homeScore: 1, awayScore: 1, note: "Pen 4-2",
    queries: [
      "Neymar scored a stunning extra-time goal for Brazil vs Croatia — show the dribble route.",
      "Croatia equalized through Petković in extra time. Was there a VAR offside check?",
    ],
    events: [
      {
        id: "2022-qf-cb-e1", minute: 105, type: "goal", team: "away", player: "Neymar",
        description: "⚽ Neymar AET",
        prompt: "2022 World Cup Quarter-final AET (Home=Croatia, Away=Brazil). 105th minute, 0-0 AET. Neymar scores a stunning individual goal in extra time. Show 2 frames: Frame 1 'Run into box' — Neymar receives the ball on the right at y≈60, dribbles inward past two Croatian defenders; Rodrygo overlapping outside. Frame 2 'Finish' — Neymar cuts inside Gvardiol and places the ball precisely into the far corner from 10 yards; Livaković has no chance; Brazil 1-0 AET. Home=Croatia, Away=Brazil.",
      },
      {
        id: "2022-qf-cb-e2", minute: 117, type: "goal", team: "home", player: "Petković",
        description: "⚽ Petković 1-1",
        prompt: "2022 World Cup Quarter-final AET (Home=Croatia, Away=Brazil). 117th minute, Croatia trailing 0-1 AET. Petković scores a long-range equalizer to force a shootout. Show 2 frames: Frame 1 'Build-up' — Croatia attack down the right; ball played to Petković on the edge of the penalty area; Brazilian defenders not closing tightly. Frame 2 'Long-range goal' — Petković shifts the ball left and drives a powerful shot past Alisson into the bottom corner from 20 yards; 1-1 AET — game goes to penalties. Home=Croatia, Away=Brazil.",
      },
    ],
  },
  {
    id: "2022-r16-arg-aus", year: 2022, stage: "Round of 16",
    home: "Argentina", away: "Australia", homeScore: 2, awayScore: 1,
    queries: [
      "Messi opened the scoring vs Australia. Show the build-up positions and offside line.",
      "Australia pulled one back late — show the defensive error in Argentina's high line.",
    ],
    events: [
      {
        id: "2022-r16-aa-e1", minute: 35, type: "goal", team: "home", player: "Messi",
        description: "⚽ Messi",
        prompt: "2022 World Cup Round of 16 (Home=Argentina, Away=Australia). 35th minute, 0-0. Messi opens the scoring with a right-foot finish. Show 2 frames: Frame 1 'Build-up' — Mac Allister plays a short pass to Messi who is positioned just inside the Australian half on the right side; Messi drives forward into the box past Australia's defensive line. Frame 2 'Finish' — Messi shoots low and right-footed past GK Ryan from just inside the penalty area; Argentina 1-0. Show the offside line — Messi is clearly onside. Home=Argentina, Away=Australia.",
      },
      {
        id: "2022-r16-aa-e2", minute: 77, type: "goal", team: "away", player: "Goodwin",
        description: "⚽ Goodwin",
        prompt: "2022 World Cup Round of 16 (Home=Argentina, Away=Australia). 77th minute, Argentina lead 2-0. Australia pull one back through Goodwin, exploiting Argentina's high defensive line. Show 2 frames: Frame 1 'High line exposed' — Argentina's defensive line is pushed very high (y≈60); Goodwin receives a ball over the top and is in behind the line. Frame 2 'Finish' — Goodwin cuts inside and finishes past Martínez from close range; 2-1. Show the offside line — Goodwin is marginally onside at the pass, VAR confirms the goal stands. Home=Argentina, Away=Australia.",
      },
    ],
  },
  {
    id: "2022-grp-arg-sau", year: 2022, stage: "Group Stage",
    home: "Argentina", away: "Saudi Arabia", homeScore: 1, awayScore: 2,
    queries: [
      "Argentina had three first-half goals disallowed by VAR for offside vs Saudi Arabia. Show the offside lines.",
      "Saudi Arabia's high defensive line caught Argentina offside repeatedly. Show the tactical setup.",
    ],
    events: [
      {
        id: "2022-gs-as-e1", minute: 9, type: "var", team: "home",
        description: "📺 VAR Offside",
        prompt: "2022 World Cup Group Stage (Home=Argentina, Away=Saudi Arabia). 9th minute. Argentina score through Lautaro Martínez but VAR disallows for offside. Show 2 frames: Frame 1 'Goal scored' — Messi plays through to Lautaro Martínez who finishes past Al-Owais; Saudi Arabia's defensive line extremely high (offside_y at y≈60). Frame 2 'VAR offside check' — offside line drawn at Saudi Arabia's last defender; Lautaro Martínez is marginally beyond the line at the moment of Messi's pass; goal disallowed. Show offside_y line. Home=Argentina, Away=Saudi Arabia.",
      },
      {
        id: "2022-gs-as-e2", minute: 53, type: "goal", team: "away", player: "Al-Shehri",
        description: "⚽ Al-Shehri",
        prompt: "2022 World Cup Group Stage (Home=Argentina, Away=Saudi Arabia). 53rd minute, Argentina leading 1-0. Saudi Arabia equalize through Al-Shehri to stun the world. Show 2 frames: Frame 1 'Counter-attack' — Saudi Arabia win the ball in midfield and break quickly; Argentina's high defensive line at y≈55 is exposed. Frame 2 'Goal' — Al-Dawsari plays in Al-Shehri who is in behind the line and slots past Martínez; 1-1. Home=Argentina, Away=Saudi Arabia.",
      },
      {
        id: "2022-gs-as-e3", minute: 90, type: "freekick", team: "home",
        description: "🎯 Late free kick",
        prompt: "2022 World Cup Group Stage (Home=Argentina, Away=Saudi Arabia). Final minutes, Saudi Arabia winning 2-1. Argentina win a free kick in a dangerous position as they desperately search for an equalizer. Show 2 frames: Frame 1 'Free kick Setup' — Messi stands over the ball about 22 yards from goal; Argentina have multiple players in the box attacking; Saudi Arabia form a 5-man wall. Frame 2 'Free kick Taken' — Messi curls a shot at goal; wall jumps; Al-Owais saves. Argentina cannot equalize; Saudi Arabia win 2-1. Home=Argentina, Away=Saudi Arabia.",
      },
    ],
  },
  {
    id: "2018-final", year: 2018, stage: "Final",
    home: "France", away: "Croatia", homeScore: 4, awayScore: 2,
    queries: [
      "France's second goal was awarded as an OG after Griezmann's free kick deflected in — how did VAR rule?",
      "Griezmann was awarded a penalty for handball by Perišić. Show the hand position and VAR protocol.",
    ],
    events: [
      {
        id: "2018-final-e1", minute: 18, type: "freekick", team: "home", player: "Griezmann",
        description: "🎯 Free kick OG",
        prompt: "2018 World Cup Final (Home=France, Away=Croatia). 18th minute, 1-1. France take a free kick from the right side; Griezmann delivers into the box and the ball deflects off Mandžukić for an own goal. Show 2 frames: Frame 1 'Free kick Setup' — Griezmann stands over the ball from wide right around y≈80; France players making runs into the box; Croatia's wall and GK Subašić positioned. Frame 2 'Delivery & OG' — Griezmann chips the ball into the box; Mandžukić's head redirects it into his own net; 2-1 France. Home=France, Away=Croatia.",
      },
      {
        id: "2018-final-e2", minute: 38, type: "penalty", team: "home", player: "Griezmann",
        description: "⚡ Griezmann pen",
        prompt: "2018 World Cup Final (Home=France, Away=Croatia). 38th minute, France lead 2-1. VAR awards France a penalty for handball by Perišić at a corner. Show 2 frames: Frame 1 'Corner delivery' — France take a corner; Griezmann's cross reaches the far post; Perišić's outstretched arm makes contact with the ball. Frame 2 'VAR review & Penalty' — incident_point where ball struck arm; VAR reviews handball; penalty awarded; Griezmann scores from the spot; 3-1 France. Home=France, Away=Croatia.",
      },
      {
        id: "2018-final-e3", minute: 52, type: "goal", team: "away", player: "Mandžukić",
        description: "⚽ Mandžukić",
        prompt: "2018 World Cup Final (Home=France, Away=Croatia). 52nd minute, France lead 3-1. Mandžukić pulls one back for Croatia to make it 3-2. Show 2 frames: Frame 1 'Mistake by Lloris' — Lloris tries to nutmeg Mandžukić instead of clearing; Mandžukić intercepts near the corner of the penalty area. Frame 2 'Finish' — Mandžukić rolls the ball into the empty net from close range; 3-2. incident_point at the ball steal location. Home=France, Away=Croatia.",
      },
    ],
  },
  {
    id: "2018-sf1", year: 2018, stage: "Semi-final",
    home: "France", away: "Belgium", homeScore: 1, awayScore: 0,
    queries: [
      "Umtiti's header from a corner won the 2018 semi-final for France. Show the corner positions.",
      "Analyse France's counter-attacking 4-4-2 block that neutralised Belgium.",
    ],
    events: [
      {
        id: "2018-sf1-e1", minute: 51, type: "corner", team: "home", player: "Griezmann",
        description: "Corner → goal",
        prompt: "2018 World Cup Semi-final (Home=France, Away=Belgium). 51st minute, 0-0. France score from a corner through Umtiti. Show 2 frames: Frame 1 'Corner Setup' — Griezmann at the bottom-right corner flag; Umtiti positions himself at the far post unmarked; Giroud provides a blocking screen; Belgium's defence focused on Giroud; Kompany not tracking Umtiti. Frame 2 'Goal' — Griezmann delivers to the far post; Umtiti rises unmarked and heads home powerfully; 1-0 France. Home=France, Away=Belgium.",
      },
    ],
  },
  {
    id: "2018-r16-arg-fra", year: 2018, stage: "Round of 16",
    home: "Argentina", away: "France", homeScore: 3, awayScore: 4,
    queries: [
      "Pavard scored a stunning volley for France — show the positions and explain why it was not offside.",
      "Mbappé scored twice in quick succession — show the positions for each goal.",
    ],
    events: [
      {
        id: "2018-r16-af-e1", minute: 57, type: "goal", team: "away", player: "Pavard",
        description: "⚽ Pavard volley",
        prompt: "2018 World Cup Round of 16 (Home=Argentina, Away=France). 57th minute, France trail 2-1. Pavard scores a spectacular volley to equalize 2-2. Show 2 frames: Frame 1 'Build-up' — Mbappé drives down the right and squares the ball low across the face of goal; Pavard arriving at pace from deep on the right. Frame 2 'Volley' — Pavard strikes a first-time right-foot volley from around 20 yards; ball swerves into the top corner; GK Armani beaten. incident_point at the strike position. Home=Argentina, Away=France.",
      },
      {
        id: "2018-r16-af-e2", minute: 64, type: "goal", team: "away", player: "Mbappé",
        description: "⚽ Mbappé 2x",
        prompt: "2018 World Cup Round of 16 (Home=Argentina, Away=France). 64th minute, 2-2. Mbappé scores twice in 4 minutes to put France in control. Show 3 frames: Frame 1 'France counter' — France break quickly; Griezmann finds Mbappé in behind Argentina's high line with a through ball at y≈60. Frame 2 'First goal at 64'' — Mbappé finishes low past Armani from inside the box; 3-2 France. Frame 3 'Second goal at 68'' — Mbappé receives again on the right and drives low across goal; 4-2 France. Show offside lines — both goals confirmed onside. Home=Argentina, Away=France.",
      },
    ],
  },
  {
    id: "2014-final", year: 2014, stage: "Final",
    home: "Germany", away: "Argentina", homeScore: 1, awayScore: 0, note: "AET",
    queries: [
      "Götze scored the winner for Germany vs Argentina in extra time — show the positions of the cross and finish.",
      "Argentina had a late chance cleared off the line — show the goalmouth positions.",
    ],
    events: [
      {
        id: "2014-final-e1", minute: 113, type: "goal", team: "home", player: "Götze",
        description: "⚽ Götze AET",
        prompt: "2014 World Cup Final AET (Home=Germany, Away=Argentina). 113th minute, 0-0 AET. Mario Götze scores the winner for Germany. Show 2 frames: Frame 1 'Cross' — Schürrle drives down the left and delivers a low cross into Argentina's penalty area; Götze makes a late run to the near post. Frame 2 'Chest & volley' — Götze controls the cross on his chest and volleys into the roof of the net; GK Romero has no chance; Germany 1-0 AET — World Champions. incident_point at the finish spot. Home=Germany, Away=Argentina.",
      },
    ],
  },
  {
    id: "2014-sf1", year: 2014, stage: "Semi-final",
    home: "Brazil", away: "Germany", homeScore: 1, awayScore: 7,
    queries: [
      "Germany scored five goals in 18 minutes against Brazil. Show the defensive breakdown for Müller's first goal.",
      "Klose's goal made him all-time top scorer — show the defensive line Brazil held.",
    ],
    events: [
      {
        id: "2014-sf1-e1", minute: 11, type: "corner", team: "away", player: "Müller",
        description: "Corner → Müller goal",
        prompt: "2014 World Cup Semi-final (Home=Brazil, Away=Germany). 11th minute, 0-0. Germany score from a corner through Müller. Show 2 frames: Frame 1 'Corner Setup' — Germany take a corner; Müller makes a near-post run; Brazil only have 3 defenders tracking runners; Dante and David Luiz ball-watching at far post. Frame 2 'Near-post header' — Müller beats his marker at the near post and heads the corner down past Julio César; Germany lead 1-0. Home=Brazil, Away=Germany.",
      },
      {
        id: "2014-sf1-e2", minute: 23, type: "goal", team: "away",
        description: "⚽ 0-5 collapse",
        prompt: "2014 World Cup Semi-final (Home=Brazil, Away=Germany). 23rd minute, Germany lead 4-0. Germany score their 5th goal as Brazil completely collapse. Show 2 frames: Frame 1 'Brazil midfield gone' — Brazil's midfield is disorganized; Sami Khedira receives the ball in space in the centre of midfield; large gaps between Brazil's players. Frame 2 'Goal' — Khedira finishes from 15 yards with Brazil unable to defend; 5-0 Germany in 23 minutes. Show Brazil's defensive line completely scattered with massive gaps. Home=Brazil, Away=Germany.",
      },
    ],
  },
  {
    id: "2014-qf-bra-col", year: 2014, stage: "Quarter-final",
    home: "Brazil", away: "Colombia", homeScore: 2, awayScore: 1,
    queries: [
      "James Rodríguez scored a consolation for Colombia vs Brazil — show the positions.",
      "The foul on Neymar that ended his tournament — explain if VAR would have upgraded it to red.",
    ],
    events: [
      {
        id: "2014-qf-bc-e1", minute: 69, type: "penalty", team: "away", player: "J. Rodríguez",
        description: "⚡ James pen",
        prompt: "2014 World Cup Quarter-final (Home=Brazil, Away=Colombia). 69th minute, Brazil lead 2-0. James Rodríguez scores a penalty for Colombia's consolation. Show 2 frames: Frame 1 'Penalty awarded' — David Luiz fouls Bacca inside the penalty area; incident_point at contact spot; James steps up. Frame 2 'Penalty scored' — James Rodríguez, top scorer of the tournament, scores from the spot; 2-1. Home=Brazil, Away=Colombia.",
      },
      {
        id: "2014-qf-bc-e2", minute: 77, type: "var", team: "home", player: "Neymar",
        description: "📺 Neymar injury foul",
        prompt: "2014 World Cup Quarter-final (Home=Brazil, Away=Colombia). 77th minute, Brazil 2-1 Colombia. Camilo Zúñiga fouls Neymar with a knee to the back, fracturing his vertebra. Show 2 frames: Frame 1 'Challenge' — Zúñiga approaches from behind; Neymar shields the ball on the right side; Zúñiga's knee makes contact with Neymar's lower back. Frame 2 'VAR review' — if VAR were available: incident_point at the foul location; the collision shows knee-to-spine contact from behind; this would be reviewed as a potential violent conduct red card. Neymar is stretchered off; injury ends his World Cup. Home=Brazil, Away=Colombia.",
      },
    ],
  },
]

export const YEARS = [...new Set(HISTORICAL_MATCHES.map(m => m.year))].sort((a, b) => b - a)
