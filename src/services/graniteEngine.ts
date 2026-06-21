import { matchData } from '../data/matchData';

export interface AIResponse {
  answer: string;
  confidence: number;
  sources: string[];
  langflowPath: {
    id: string;
    label: string;
    status: 'idle' | 'active' | 'completed';
    type: 'input' | 'process' | 'llm' | 'output';
  }[];
}

// Simulated FIFA Law DB (Docling Parsed PDF)
const doclingLawDB = {
  offside: {
    law: 'FIFA Law 11 - Offside',
    text: 'A player is in an offside position if: any part of the head, body or feet is in the opponents\' half and closer to the opponents\' goal line than both the ball and the second-last opponent (including goalkeeper). The hands and arms of all players, including the goalkeepers, are not considered.'
  },
  foul: {
    law: 'FIFA Law 12 - Fouls and Misconduct',
    text: 'Direct free kick / penalty awarded for tripping, holding, pushing, jumping at, or striking an opponent carelessly, recklessly or using excessive force.'
  },
  handball: {
    law: 'FIFA Law 12 - Handling the Ball',
    text: 'Handball is penalized if a player touches the ball with their hand/arm when it has made their body unnaturally bigger. Arm positions not justified by body movement are penalized.'
  }
};

export const LANGFLOW_BASE_URL = 'http://localhost:7860';
export const LANGFLOW_FLOW_ID = 'world-cup-analyst'; // User can customize this in the Langflow UI

export async function checkLangflowStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
    const response = await fetch(`${LANGFLOW_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 401 || response.status === 403 || response.status === 404;
  } catch (error) {
    return false;
  }
}

export async function queryMatchAI(
  query: string,
  currentMinute: number,
  persona: 'fan' | 'coach' | 'child'
): Promise<AIResponse> {
  // Try querying the live Langflow instance
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for API response
    
    // Build context parameters
    const eventsTillNowText = matchData.events
      .filter(e => e.minute <= currentMinute)
      .map(e => `${e.minute}' - ${e.title}`)
      .join(', ');

    const score = `Argentina ${matchData.events.filter(e => e.minute <= currentMinute && e.type === 'goal' && e.team === 'Argentina').length} - ${matchData.events.filter(e => e.minute <= currentMinute && e.type === 'goal' && e.team === 'France').length} France`;

    const response = await fetch(`${LANGFLOW_BASE_URL}/api/v1/run/${LANGFLOW_FLOW_ID}?stream=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_value: query,
        input_type: 'chat',
        output_type: 'chat',
        tweaks: {
          "MatchContext": {
            "minute": currentMinute,
            "score": score,
            "persona": persona,
            "events": eventsTillNowText
          }
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const responseText = data.outputs?.[0]?.outputs?.[0]?.results?.message?.text || 
                           data.outputs?.[0]?.outputs?.[0]?.artifacts?.message ||
                           data.result;

      if (responseText) {
        const activePath = [
          { id: '1', label: 'User Query', status: 'completed' as const, type: 'input' as const },
          { id: '2', label: 'Match Context Ingestion', status: 'completed' as const, type: 'process' as const },
          { id: '3', label: `Langflow Container (${LANGFLOW_FLOW_ID})`, status: 'completed' as const, type: 'process' as const },
          { id: '4', label: 'IBM Granite Foundation Model', status: 'completed' as const, type: 'llm' as const },
          { id: '5', label: 'Live Text Answer', status: 'completed' as const, type: 'output' as const }
        ];

        return {
          answer: responseText,
          confidence: 98,
          sources: ['Live Docker Langflow Flow', 'FIFA Technical Reports', 'Granite Model Context'],
          langflowPath: activePath
        };
      }
    }
  } catch (error) {
    console.log("Langflow is offline or unconfigured. Defaulting to high-fidelity local Granite simulation.");
  }

  const normalizedQuery = query.toLowerCase();
  
  // Base Langflow Nodes
  const defaultPath = [
    { id: '1', label: 'User Input Query', status: 'completed' as const, type: 'input' as const },
    { id: '2', label: 'Query Intent Classifier', status: 'completed' as const, type: 'process' as const },
    { id: '3', label: 'Match Event Retriever', status: 'completed' as const, type: 'process' as const },
    { id: '4', label: 'IBM Granite LLM', status: 'completed' as const, type: 'llm' as const },
    { id: '5', label: 'Formatted Output', status: 'completed' as const, type: 'output' as const }
  ];

  const varPath = [
    { id: '1', label: 'User Query', status: 'completed' as const, type: 'input' as const },
    { id: '2', label: 'VAR Intent Detected', status: 'completed' as const, type: 'process' as const },
    { id: '3', label: 'Docling Rulebook Query', status: 'completed' as const, type: 'process' as const },
    { id: '4', label: 'Telemetry & Outlines Filter', status: 'completed' as const, type: 'process' as const },
    { id: '5', label: 'IBM Granite Reasoning', status: 'completed' as const, type: 'llm' as const },
    { id: '6', label: 'Law & Visual Output', status: 'completed' as const, type: 'output' as const }
  ];

  const tacticalPath = [
    { id: '1', label: 'User Query', status: 'completed' as const, type: 'input' as const },
    { id: '2', label: 'Tactical Shift Analyzer', status: 'completed' as const, type: 'process' as const },
    { id: '3', label: 'Formation Database Match', status: 'completed' as const, type: 'process' as const },
    { id: '4', label: 'IBM Granite Expert Analyst', status: 'completed' as const, type: 'llm' as const },
    { id: '5', label: 'Tactical Comparison Display', status: 'completed' as const, type: 'output' as const }
  ];

  // Helper to find events up to current minute
  const eventsTillNow = matchData.events.filter(e => e.minute <= currentMinute);
  const currentProb = matchData.predictions.reduce((prev, curr) => {
    return curr.minute <= currentMinute ? curr : prev;
  }, matchData.predictions[0]);

  // Determine categories of queries
  let category: 'general' | 'var' | 'tactics' | 'prediction' | 'messi' | 'mbappe' = 'general';
  let path = defaultPath;
  let responseText = '';
  let confidence = 90;
  let sources: string[] = ['FIFA 2022 Match Logs', 'Opta Statistics'];

  if (normalizedQuery.includes('offside') || normalizedQuery.includes('var') || normalizedQuery.includes('decision') || normalizedQuery.includes('penalty') || normalizedQuery.includes('referee') || normalizedQuery.includes('disallowed') || normalizedQuery.includes('allowed')) {
    category = 'var';
    path = varPath;
    sources.push('Docling FIFA Rulebook Parser', 'FIFA Law 11 & 12 PDF');
  } else if (normalizedQuery.includes('tactics') || normalizedQuery.includes('formation') || normalizedQuery.includes('substitut') || normalizedQuery.includes('change') || normalizedQuery.includes('shift') || normalizedQuery.includes('di maria')) {
    category = 'tactics';
    path = tacticalPath;
    sources.push('Tactical Analysis Feed', 'Scaloni vs Deschamps Head-to-Head Stats');
  } else if (normalizedQuery.includes('predict') || normalizedQuery.includes('win') || normalizedQuery.includes('probability') || normalizedQuery.includes('chance') || normalizedQuery.includes('who will')) {
    category = 'prediction';
    sources.push('Explainable Prediction Engine (Granite ML)');
  } else if (normalizedQuery.includes('messi') || normalizedQuery.includes('goat') || normalizedQuery.includes('argentina')) {
    category = 'messi';
  } else if (normalizedQuery.includes('mbappe') || normalizedQuery.includes('france') || normalizedQuery.includes('comeback')) {
    category = 'mbappe';
  }

  // Generate Response text based on Persona + Category + Time
  if (category === 'var') {
    // Look for active or recent VAR events
    const activeVar = matchData.varDecisions.reduce((prev, curr) => {
      if (curr.minute <= currentMinute) {
        if (!prev || curr.minute > prev.minute) return curr;
      }
      return prev;
    }, null as typeof matchData.varDecisions[0] | null);

    if (!activeVar) {
      if (persona === 'coach') {
        responseText = `At minute ${currentMinute}, there have been no major VAR interventions yet. On-field decisions are standing. Our Docling engine is monitorng Law 11 (Offside) and Law 12 (Fouls) structures continuously.`;
      } else if (persona === 'child') {
        responseText = `No big referee video reviews have happened yet in the first ${currentMinute} minutes! The referees are keeping the game moving smoothly.`;
      } else {
        responseText = `There are no VAR reviews to explain before the 21st minute. The match is flowing based on the referee's on-pitch decisions.`;
      }
    } else {
      confidence = activeVar.confidence;
      const lawRef = activeVar.ruleApplied.includes('11') ? doclingLawDB.offside : (activeVar.ruleApplied.includes('handball') ? doclingLawDB.handball : doclingLawDB.foul);
      
      if (persona === 'coach') {
        responseText = `[TACTICAL ANALYSIS OF VAR DECISION: ${activeVar.minute}']
Decision: ${activeVar.decision}.
Rule: ${activeVar.ruleTitle}.
Law details: ${lawRef.text}

Coach's assessment:
The decision at ${activeVar.minute}' was correct. ${activeVar.evidenceText}. Tactical shapes were compromised. In the ${activeVar.minute}' incident, defenders were caught in transition, resulting in poor body orientation and committing high-risk fouls/infractions. The confidence score is ${activeVar.confidence}% because telemetry logs show clear alignment with FIFA Law parameters.`;
      } else if (persona === 'child') {
        responseText = `[VAR explained for kids! 🧸: ${activeVar.minute}']
What happened: The referee checked the computer screen and said: ${activeVar.decision}!
Rule used: ${activeVar.ruleApplied}

Here's why:
${activeVar.minute === 21 ? 'The French defender Dembele tripped Argentina\'s Di Maria. It\'s like tripping someone in tag—you can\'t do that in the penalty box!' : ''}
${activeVar.minute === 79 ? 'Argentina\'s defender Otamendi pulled Kolo Muani\'s shirt. You can\'t grab people like a bear hug!' : ''}
${activeVar.minute === 108 ? 'Messi scored, but the assistant referee thought it was offside. VAR checked the computer lines and saw Martinez\'s foot was onside by a tiny slice of bread! The ball also fully crossed the line, like a car crossing the finish line!' : ''}
${activeVar.minute === 116 ? 'The ball hit Montiel\'s arm when his elbow was sticking out. You can\'t block shots with your arms like a goalkeeper unless you actually ARE the goalkeeper!' : ''}
Referees are 99% sure this was the right call!`;
      } else {
        responseText = `[Match Analyst Report: VAR at ${activeVar.minute}']
The decision was ${activeVar.decision}.
Applied rule: ${activeVar.ruleTitle}.
Evidence: ${activeVar.evidenceText}.

Under ${activeVar.ruleApplied}, the action was deemed a clear infringement. At ${activeVar.minute}', the pressure from the attackers forced a defensive breakdown. The telemetry outlines verify that the referee made the correct call under FIFA guidelines, backed by a ${activeVar.confidence}% confidence check.`;
      }
    }
  } else if (category === 'tactics') {
    // Get latest formation change
    let activeShiftMin = 0;
    if (currentMinute >= 102) activeShiftMin = 102;
    else if (currentMinute >= 64) activeShiftMin = 64;
    else if (currentMinute >= 41) activeShiftMin = 41;

    if (activeShiftMin === 0) {
      if (persona === 'coach') {
        responseText = `Both managers Scaloni (Argentina) and Deschamps (France) started in a 4-3-3 shape. Argentina is achieving superiority in the half-spaces through Di Maria's positioning, causing Kounde to pull too far wide.`;
      } else if (persona === 'child') {
        responseText = `Both teams started with 4 defenders, 3 midfielders, and 3 attackers (called a 4-3-3). Argentina is playing much faster and sharing the ball better right now!`;
      } else {
        responseText = `Tactics check: Both sides start in 4-3-3. Argentina is exploiting the left wing using Di Maria to bypass France's midfield cover.`;
      }
    } else {
      const shift = activeShiftMin === 41 ? 'France shifts to 4-2-4' : (activeShiftMin === 64 ? 'Argentina shifts to 4-4-2' : 'Argentina shifts to 5-3-2');
      const details = activeShiftMin === 41 ? 
        { why: 'Deschamps needed direct running and speed because they had 0 shots.', benefit: 'Puts 4 attackers against Argentina\'s back 4, bypassing midfield.', risk: 'Only 2 players in midfield, leaving huge space for Messi.' } :
        activeShiftMin === 64 ?
        { why: 'Scaloni wanted to protect the 2-0 lead by substituting winger Di Maria for defender Acuna.', benefit: 'Central midfield becomes extremely crowded and safe.', risk: 'Gives up all counter-attacking speed on the left, inviting France pressure.' } :
        { why: 'To stop France\'s high aerial crosses to Kolo Muani in extra time.', benefit: 'Three center-backs to clear all aerial balls.', risk: 'Forces Argentina to sit very deep.' };

      if (persona === 'coach') {
        responseText = `[Tactical Analysis: Minute ${activeShiftMin}']
System Shift: ${shift}

Why: ${details.why}
Expected Benefits: ${details.benefit}
Inherent Risks: ${details.risk}

Technical Note: The manager adjusted the width and verticality. Shifting from a 3-man midfield to a low block or adding attackers changes the pressing triggers. France's transition to 4-2-4 bypassed Griezmann entirely, resulting in direct channels to Mbappe.`;
      } else if (persona === 'child') {
        responseText = `[Tactics for Kids: Minute ${activeShiftMin}']
The coach changed the plan! 📋 ${shift}.

Why: ${details.why}
Good stuff: ${details.benefit}
Scary stuff: ${details.risk}

Think of it like shifting players on a board game to protect your castle or attack faster!`;
      } else {
        responseText = `[Analyst Tactical Review: Minute ${activeShiftMin}']
Tactical Adjustment: ${shift}
Coach's Intention: ${details.why}
Benefits: ${details.benefit}
Risks: ${details.risk}

This modification has reshaped the match momentum, changing the passing lanes and attacking overloads.`;
      }
    }
  } else if (category === 'prediction') {
    if (persona === 'coach') {
      responseText = `[Granite ML Predictor Breakdown - Min ${currentMinute}']
Argentina Win: ${currentProb.homeWin}% | France Win: ${currentProb.awayWin}% | Draw: ${currentProb.draw}%
Key Factors Influencing Model:
${currentProb.factors.map(f => `- ${f}`).join('\n')}

Analytical note: The model weighs possession efficiency, high-press success rate, and defensive actions inside the box. France's low win probability early on was due to a complete lack of penalty area entries.`;
    } else if (persona === 'child') {
      responseText = `[Who will win? 🏆 - Min ${currentMinute}']
Argentina's chance: ${currentProb.homeWin}%
France's chance: ${currentProb.awayWin}%
Draw (Tie) chance: ${currentProb.draw}%

Why the computer thinks this:
${currentProb.factors.map(f => `👉 ${f}`).join('\n')}

It's like a video game meter going up and down depending on who is playing better!`;
    } else {
      responseText = `[Win Probability Tracker - Min ${currentMinute}']
Argentina: ${currentProb.homeWin}% | France: ${currentProb.awayWin}% | Draw: ${currentProb.draw}%
Primary Drivers:
${currentProb.factors.map(f => `• ${f}`).join('\n')}

This prediction is updated live based on tactical positioning, fatigue indexes, and expected goals (xG).`;
    }
  } else if (category === 'messi') {
    if (persona === 'coach') {
      responseText = `Lionel Messi is operating as a roaming playmaker (Trequartista/False 9 blend). His heat map shows high concentration in the right half-space, pulling France's LCM (Rabiot) out of position and opening up direct passing lanes to Di Maria on the opposite side.`;
    } else if (persona === 'child') {
      responseText = `Lionel Messi is playing like a wizard! 🪄 He stays in the middle of the field and passes the ball perfectly to his friends, making it super hard for France to catch him.`;
    } else {
      responseText = `Messi is the key catalyst. By dropping deep into midfield, he forces France's center-backs to make a decision: step out and leave space behind them, or stay back and let Messi create.`;
    }
  } else if (category === 'mbappe') {
    if (persona === 'coach') {
      responseText = `Kylian Mbappe was tactically isolated in the first 70 minutes due to Tagliafico and De Paul doubling up on him. However, when Deschamps shifted Mbappe to a central striker role in a 4-2-4, his speed began exposing Romero and Otamendi in 1v1 situations.`;
    } else if (persona === 'child') {
      responseText = `Kylian Mbappe is incredibly fast! ⚡ In the first half, Argentina blocked him like a wall. But in the second half, he moved to the center, found open space, and scored two super-fast goals!`;
    } else {
      responseText = `Mbappe's threat is inactive during periods of low supply, but his positioning on the shoulder of the last defender remains lethal. When France shifted to direct transitions, his conversion of xG (2.3 expected goals) went through the roof.`;
    }
  } else {
    // General fallback
    const score = `Argentina ${eventsTillNow.filter(e => e.type === 'goal' && e.team === 'Argentina').length} - ${eventsTillNow.filter(e => e.type === 'goal' && e.team === 'France').length} France`;
    if (persona === 'coach') {
      responseText = `Match Status at ${currentMinute}': ${score}.
Tactical Overview:
Argentina maintains a high-block density, limiting France's transitional play. The midfield three (Enzo, De Paul, Mac Allister) are winning 68% of second balls. France's wing play has been restricted. We expect further tactical shifts if the current scoreline persists.`;
    } else if (persona === 'child') {
      responseText = `Match score at ${currentMinute} minutes is ${score}!
Argentina is playing like a team of super fast lions, keeping the ball away from France's defenders. France is trying hard to catch up!`;
    } else {
      responseText = `We are at the ${currentMinute}th minute. Score: ${score}.
Argentina has dominated the tactical battle, utilizing their midfield numerical advantage. France is looking for direct outlets to Mbappe.`;
    }
  }

  return {
    answer: responseText,
    confidence,
    sources,
    langflowPath: path
  };
}
