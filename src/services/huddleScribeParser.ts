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
 * Resilient deterministic parser used both offline and as a client/server fallback.
 */
export function intelligentFallbackParser(text: string, context: ScribeContext): ScribeResponse {
  const lower = text.toLowerCase();
  const actions: ScribeAction[] = [];
  const actionId = () => `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Create New Metric KPI
  if ((lower.includes('metric') || lower.includes('kpi') || lower.includes('widget')) && (lower.includes('new') || lower.includes('create') || lower.includes('add') || lower.includes('track'))) {
    const match = text.match(/(?:metric|kpi|widget)\s*(?:called|named|:|\-)?\s*([A-Za-z0-9\s\-/%]+?)(?:\s+(?:target|unit|under|pillar|for|daily|weekly|monthly)|$)/i);
    const metricTitle = match && match[1]?.trim().length > 2 ? match[1].trim() : 'New Stand-up KPI';
    const targetMatch = text.match(/target\s*(?:of|is|=)?\s*(\d+(?:\.\d+)?)/i);
    const matchedEmp = context.employees.find(e => lower.includes(e.name.toLowerCase()));
    const pillar =
      lower.includes('safety') ? 'Safety' :
      lower.includes('sustain') || lower.includes('energy') || lower.includes('co2') ? 'Sustainability' :
      lower.includes('qual') || lower.includes('scrap') || lower.includes('defect') ? 'Quality' :
      lower.includes('cost') || lower.includes('oee') || lower.includes('downtime') ? 'Cost' :
      lower.includes('cap') ? 'Capital' : 'Delivery';

    actions.push({
      id: actionId(),
      type: 'CREATE_NEW_METRIC',
      title: `Create Metric: "${metricTitle}"`,
      description: `Add new ${pillar} KPI widget${targetMatch ? ` with target ${targetMatch[1]}` : ''}`,
      payload: {
        title: metricTitle,
        pillar,
        level: lower.includes('weekly') ? 'weekly' : lower.includes('monthly') ? 'monthly' : 'daily',
        type: 'numeric',
        target: targetMatch ? parseFloat(targetMatch[1]) : 100,
        actual: targetMatch ? parseFloat(targetMatch[1]) : 0,
        owner: matchedEmp?.name || 'Team Lead'
      },
      confidence: 0.89
    });
  }

  // 2. Metric Value / Actual Updates
  for (const widget of context.widgets) {
    const titleLower = widget.title.toLowerCase();
    const words = titleLower.split(' ').filter(w => w.length > 3);
    const matchesWidget = titleLower.length > 3 && (lower.includes(titleLower) || words.some(w => lower.includes(w)));

    if (matchesWidget) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (numMatch && (lower.includes('actual') || lower.includes('was') || lower.includes('is') || lower.includes('reached') || lower.includes('count') || lower.includes('recorded') || lower.includes('to'))) {
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

      if (lower.includes('red') || lower.includes('fail') || lower.includes('deviation') || lower.includes('missed')) {
        actions.push({
          id: actionId(),
          type: 'UPDATE_METRIC_STATE',
          title: `Flag "${widget.title}" as Deviation`,
          description: 'Mark status as RED (Deviation identified on shop floor)',
          payload: { widgetId: widget.id, state: 'red' },
          confidence: 0.88
        });
        break;
      } else if (lower.includes('green') || lower.includes('pass') || lower.includes('target met') || lower.includes('on track')) {
        actions.push({
          id: actionId(),
          type: 'UPDATE_METRIC_STATE',
          title: `Set "${widget.title}" as Target Met`,
          description: 'Mark status as GREEN (Operational targets satisfied)',
          payload: { widgetId: widget.id, state: 'green' },
          confidence: 0.88
        });
        break;
      }
    }
  }

  // 3. Escalation to Weekly Analysis
  if (lower.includes('weekly') && (lower.includes('add') || lower.includes('escalate') || lower.includes('send') || lower.includes('5-why') || lower.includes('root cause'))) {
    const target = context.widgets.find(w => lower.includes(w.title.toLowerCase())) || context.widgets.find(w => w.state === 'red');
    if (target) {
      actions.push({
        id: actionId(),
        type: 'ADD_METRIC_TO_WEEKLY',
        title: `Escalate "${target.title}" to Weekly Stand-up`,
        description: 'Add this operational deviation to Weekly 5-Whys Analysis Desk',
        payload: { widgetId: target.id },
        confidence: 0.95
      });
    }
  }

  // 4. Create New Project
  if (lower.includes('project') && (lower.includes('new') || lower.includes('create') || lower.includes('start') || lower.includes('kick off') || lower.includes('launch'))) {
    const match = text.match(/(?:project|initiative)\s*[:\-]?\s*([A-Za-z0-9\s\-]+?)(?:\s+(?:owned by|owner|with|targeted|target|by|,)|$)/i);
    const projectName = match && match[1]?.trim().length > 3 ? match[1].trim() : 'New Operational Project';
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
        description: 'Created live by AI Huddle Scribe during stand-up meeting.'
      },
      confidence: 0.9
    });
  }

  // 5. Create Action Item
  if (lower.includes('assign') || lower.includes('action') || lower.includes('task') || lower.includes('need to') || lower.includes('should check')) {
    const matchedEmp = context.employees.find(e => lower.includes(e.name.toLowerCase()));
    const ownerName = matchedEmp ? matchedEmp.name : 'Shift Supervisor';

    actions.push({
      id: actionId(),
      type: 'CREATE_ACTION_ITEM',
      title: `Action: ${text.slice(0, 45)}${text.length > 45 ? '...' : ''}`,
      description: `Countermeasure assigned to ${ownerName} with High priority`,
      payload: {
        title: text.replace(/^(please|can you|let's|assign)\s+/i, '').trim(),
        pillar: lower.includes('safety') ? 'Safety' : lower.includes('quality') ? 'Quality' : lower.includes('cost') ? 'Cost' : 'Delivery',
        owner: ownerName,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: lower.includes('urgent') || lower.includes('critical') ? 'critical' : 'high',
        notes: `Created via AI Huddle Scribe from meeting statement: "${text}"`
      },
      confidence: 0.85
    });
  }

  // 6. Safety Cross Updates
  if (lower.includes('safety cross') || lower.includes('safety calendar') || lower.includes('near-miss') || (lower.includes('day') && (lower.includes('green') || lower.includes('red') || lower.includes('amber')))) {
    const dayMatch = text.match(/day\s*(\d{1,2})/i);
    const day = dayMatch ? Math.min(31, Math.max(1, parseInt(dayMatch[1], 10))) : new Date().getDate();
    const isRed = lower.includes('red') || lower.includes('incident') || lower.includes('hazard');
    const isAmber = lower.includes('amber') || lower.includes('near-miss');
    const status = isRed ? 'red' : isAmber ? 'amber' : 'green';

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
