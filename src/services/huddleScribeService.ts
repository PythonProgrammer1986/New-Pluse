import { GoogleGenAI } from '@google/genai';

export interface ScribeContext {
  widgets: Array<{
    id: string;
    title: string;
    pillar: string;
    level: string;
    actual?: number;
    target?: number;
    value?: number;
    state: 'green' | 'red';
    owner?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    code: string;
    owner?: string;
  }>;
  employees: Array<{
    id: string;
    name: string;
  }>;
}

export interface ScribeAction {
  id: string;
  type: 
    | 'UPDATE_METRIC_VALUE'
    | 'UPDATE_METRIC_STATE'
    | 'ADD_METRIC_TO_WEEKLY'
    | 'CREATE_NEW_METRIC'
    | 'CREATE_NEW_PROJECT'
    | 'CREATE_ACTION_ITEM'
    | 'UPDATE_SAFETY_CROSS';
  title: string;
  description: string;
  payload: any;
  confidence: number;
}

export interface ScribeResponse {
  spokenText: string;
  summary: string;
  actions: ScribeAction[];
  modelUsed: string;
}

/**
 * Parses spoken huddle meeting statements into actionable operational state changes.
 */
export async function parseHuddleMeetingSpeech(
  spokenText: string,
  context: ScribeContext,
  apiKey?: string
): Promise<ScribeResponse> {
  const effectiveKey =
    apiKey ||
    (typeof process !== 'undefined' && process.env ? (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_KEY
    ) : undefined);

  if (effectiveKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the Epiroc Lean Operations Huddle AI Scribe.
Your job is to analyze real-time spoken statements from a shop-floor stand-up meeting and translate them into structured operational database updates.

Current Board Context:
1. Registered Metric Widgets:
${context.widgets.map(w => `  - ID: "${w.id}", Title: "${w.title}", Pillar: ${w.pillar}, Target: ${w.target ?? 'N/A'}, Actual: ${w.actual ?? w.value ?? 'N/A'}, State: ${w.state}, Owner: ${w.owner || 'Unassigned'}`).join('\n')}

2. Registered Projects:
${context.projects.map(p => `  - ID: "${p.id}", Name: "${p.name}", Code: "${p.code}", Owner: ${p.owner || 'Unassigned'}`).join('\n')}

3. Registered Team Members (Employees):
${context.employees.map(e => `  - ID: "${e.id}", Name: "${e.name}"`).join('\n')}

User Spoken Text:
"${spokenText}"

Identify all concrete operational actions mentioned. Supported action types:
1. UPDATE_METRIC_VALUE: { widgetId: string, actual: number, notes?: string }
   - Used when someone mentions an actual metric number (e.g. "hazards was 2", "actual scrap reached 14", "energy consumption was 420").
2. UPDATE_METRIC_STATE: { widgetId: string, state: 'green' | 'red' }
   - Used when someone says a metric passed, failed, is on track, or in deviation.
3. ADD_METRIC_TO_WEEKLY: { widgetId: string }
   - Used when someone explicitly asks to escalate a metric or deviation to weekly analysis / 5-whys stand-up.
4. CREATE_NEW_METRIC: { title: string, pillar: 'Safety' | 'Sustainability' | 'Quality' | 'Delivery' | 'Cost' | 'Capital', level: 'daily' | 'weekly' | 'monthly', type: 'numeric' | 'checklist' | 'counter', target?: number, actual?: number, unit?: string, owner?: string, description?: string }
   - Used when the team decides to start tracking a brand new KPI.
5. CREATE_NEW_PROJECT: { name: string, code?: string, owner?: string, targetLaunchDate?: string, description?: string }
   - Used when someone announces a new project, machine line, or initiative.
6. CREATE_ACTION_ITEM: { title: string, pillar: 'Safety' | 'Sustainability' | 'Quality' | 'Delivery' | 'Cost' | 'Capital', owner: string, dueDate?: string, priority: 'low' | 'medium' | 'high' | 'critical', notes?: string }
   - Used when a task, assignment, or countermeasure is given to a person.
7. UPDATE_SAFETY_CROSS: { dayIndex: number, status: 'green' | 'red' | 'amber', note?: string }
   - Used when discussing safety calendar days (1-31).

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Brief 1-sentence recap of what was understood",
  "actions": [
    {
      "type": "UPDATE_METRIC_VALUE" | "UPDATE_METRIC_STATE" | "ADD_METRIC_TO_WEEKLY" | "CREATE_NEW_METRIC" | "CREATE_NEW_PROJECT" | "CREATE_ACTION_ITEM" | "UPDATE_SAFETY_CROSS",
      "title": "Short title describing the action",
      "description": "Readable explanation of what will be updated",
      "payload": { ...type-specific payload... },
      "confidence": number between 0.0 and 1.0
    }
  ]
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out after 5s')), 5000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        }),
        timeoutPromise
      ]);

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      return {
        spokenText,
        summary: parsed.summary || 'Meeting statement processed.',
        actions: (parsed.actions || []).map((act: any, idx: number) => ({
          ...act,
          id: `act-${Date.now()}-${idx}`
        })),
        modelUsed: 'gemini-3.8-flash'
      };
    } catch (err) {
      console.warn('Gemini API call encountered an issue, using intelligent fallback parser:', err);
    }
  }

  // Intelligent Rule-based and Fuzzy Fallback Parser
  return intelligentFallbackParser(spokenText, context);
}

/**
 * Resilient deterministic parser when offline, testing, or awaiting API key setup.
 */
export function intelligentFallbackParser(text: string, context: ScribeContext): ScribeResponse {
  const lower = text.toLowerCase();
  const actions: ScribeAction[] = [];
  const actionId = () => `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Metric Value / Actual Updates
  for (const widget of context.widgets) {
    const titleLower = widget.title.toLowerCase();
    const words = titleLower.split(' ').filter(w => w.length > 3);
    const matchesWidget = titleLower.length > 3 && (lower.includes(titleLower) || words.some(w => lower.includes(w)));

    if (matchesWidget) {
      // Look for numbers near the metric name
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (numMatch && (lower.includes('actual') || lower.includes('was') || lower.includes('is') || lower.includes('reached') || lower.includes('count') || lower.includes('recorded'))) {
        const val = parseFloat(numMatch[1]);
        actions.push({
          id: actionId(),
          type: 'UPDATE_METRIC_VALUE',
          title: `Update Actual for "${widget.title}"`,
          description: `Update actual value to ${val} (Target: ${widget.target ?? 'N/A'})`,
          payload: { widgetId: widget.id, actual: val },
          confidence: 0.92
        });
        break;
      }

      // Check if state change was requested
      if (lower.includes('red') || lower.includes('fail') || lower.includes('deviation') || lower.includes('missed')) {
        actions.push({
          id: actionId(),
          type: 'UPDATE_METRIC_STATE',
          title: `Flag "${widget.title}" as Deviation`,
          description: `Mark status as RED (Deviation identified on shop floor)`,
          payload: { widgetId: widget.id, state: 'red' },
          confidence: 0.88
        });
        break;
      } else if (lower.includes('green') || lower.includes('pass') || lower.includes('target met') || lower.includes('on track')) {
        actions.push({
          id: actionId(),
          type: 'UPDATE_METRIC_STATE',
          title: `Set "${widget.title}" as Target Met`,
          description: `Mark status as GREEN (Operational targets satisfied)`,
          payload: { widgetId: widget.id, state: 'green' },
          confidence: 0.88
        });
        break;
      }
    }
  }

  // 2. Escalation to Weekly Analysis
  if (lower.includes('weekly') && (lower.includes('add') || lower.includes('escalate') || lower.includes('send') || lower.includes('5-why') || lower.includes('root cause'))) {
    // Find matching widget or pick the first red widget
    const target = context.widgets.find(w => lower.includes(w.title.toLowerCase())) || context.widgets.find(w => w.state === 'red');
    if (target) {
      actions.push({
        id: actionId(),
        type: 'ADD_METRIC_TO_WEEKLY',
        title: `Escalate "${target.title}" to Weekly Stand-up`,
        description: `Add this operational deviation to Weekly 5-Whys Analysis Desk`,
        payload: { widgetId: target.id },
        confidence: 0.95
      });
    }
  }

  // 3. Create New Project
  if (lower.includes('project') && (lower.includes('new') || lower.includes('create') || lower.includes('start') || lower.includes('kick off') || lower.includes('launch'))) {
    // Extract name
    const match = text.match(/(?:project|initiative)\s*[:\-]?\s*([A-Za-z0-9\s\-]+?)(?:\s+(?:owned by|owner|with|targeted|target|by)|$)/i);
    const projectName = match && match[1]?.trim().length > 3 ? match[1].trim() : 'New Operational Project';
    
    // Find owner if mentioned
    const matchedEmp = context.employees.find(e => lower.includes(e.name.toLowerCase()));

    actions.push({
      id: actionId(),
      type: 'CREATE_NEW_PROJECT',
      title: `Create Project: "${projectName}"`,
      description: `Add new project matrix record with owner: ${matchedEmp ? matchedEmp.name : 'Team Lead'}`,
      payload: {
        name: projectName,
        owner: matchedEmp ? matchedEmp.name : 'Team Lead',
        targetLaunchDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Created live by AI Huddle Scribe during stand-up meeting.`
      },
      confidence: 0.9
    });
  }

  // 4. Create Action Item
  if (lower.includes('assign') || lower.includes('action') || lower.includes('task') || lower.includes('need to') || lower.includes('should check')) {
    const matchedEmp = context.employees.find(e => lower.includes(e.name.toLowerCase()));
    const ownerName = matchedEmp ? matchedEmp.name : 'Shift Supervisor';
    
    actions.push({
      id: actionId(),
      type: 'CREATE_ACTION_ITEM',
      title: `Action: ${text.slice(0, 45)}...`,
      description: `Countermeasure assigned to ${ownerName} with High priority`,
      payload: {
        title: text.replace(/^(please|can you|let's|assign)\s+/i, '').trim(),
        pillar: lower.includes('safety') ? 'Safety' : lower.includes('quality') ? 'Quality' : lower.includes('cost') ? 'Cost' : 'Delivery',
        owner: ownerName,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: lower.includes('urgent') || lower.includes('critical') ? 'critical' : 'high',
        notes: `Created automatically via AI Huddle Scribe from meeting audio: "${text}"`
      },
      confidence: 0.85
    });
  }

  // 5. Safety Cross Updates
  if (lower.includes('safety cross') || lower.includes('safety calendar') || lower.includes('near-miss') || lower.includes('day')) {
    const dayMatch = text.match(/day\s*(\d{1,2})/i);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : new Date().getDate();
    const isRed = lower.includes('red') || lower.includes('incident') || lower.includes('hazard') || lower.includes('near-miss');
    const status = isRed ? 'red' : 'green';

    actions.push({
      id: actionId(),
      type: 'UPDATE_SAFETY_CROSS',
      title: `Log Day ${day} on Safety Cross`,
      description: `Set Safety Cross status for Day ${day} to ${status.toUpperCase()}`,
      payload: {
        dayIndex: day,
        status,
        note: `Logged via AI Scribe: "${text}"`
      },
      confidence: 0.94
    });
  }

  return {
    spokenText: text,
    summary: actions.length > 0 
      ? `Identified ${actions.length} operational action${actions.length > 1 ? 's' : ''} from spoken statement.`
      : 'Statement recorded; no structural board changes triggered.',
    actions,
    modelUsed: 'deterministic-lean-parser'
  };
}
