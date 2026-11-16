import { GoogleGenAI } from '@google/genai';
import {
  ScribeContext,
  ScribeAction,
  ScribeResponse,
  intelligentFallbackParser
} from './huddleScribeParser';

export type { ScribeContext, ScribeAction, ScribeResponse };
export { intelligentFallbackParser };

/**
 * Server-side parser that calls Gemini (`gemini-4-hydrogen`) and falls back to the
 * deterministic rule engine if no API key is configured or the request fails.
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
2. UPDATE_METRIC_STATE: { widgetId: string, state: 'green' | 'red' }
3. ADD_METRIC_TO_WEEKLY: { widgetId: string }
4. CREATE_NEW_METRIC: { title: string, pillar: 'Safety' | 'Sustainability' | 'Quality' | 'Delivery' | 'Cost' | 'Capital', level: 'daily' | 'weekly' | 'monthly', type: 'numeric' | 'checklist' | 'counter', target?: number, actual?: number, unit?: string, owner?: string, description?: string }
5. CREATE_NEW_PROJECT: { name: string, code?: string, owner?: string, targetLaunchDate?: string, description?: string }
6. CREATE_ACTION_ITEM: { title: string, pillar: 'Safety' | 'Sustainability' | 'Quality' | 'Delivery' | 'Cost' | 'Capital', owner: string, dueDate?: string, priority: 'low' | 'medium' | 'high', notes?: string }
7. UPDATE_SAFETY_CROSS: { dayIndex: number, status: 'green' | 'red' | 'amber', note?: string }

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Brief 1-sentence recap of what was understood",
  "actions": [
    {
      "type": "UPDATE_METRIC_VALUE" | "UPDATE_METRIC_STATE" | "ADD_METRIC_TO_WEEKLY" | "CREATE_NEW_METRIC" | "CREATE_NEW_PROJECT" | "CREATE_ACTION_ITEM" | "UPDATE_SAFETY_CROSS",
      "title": "Short title describing the action",
      "description": "Readable explanation of what will be updated",
      "payload": {},
      "confidence": 0.9
    }
  ]
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out after 12s')), 12000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
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
        modelUsed: 'gemini-4-hydrogen'
      };
    } catch (err) {
      console.warn('Gemini API call encountered an issue, using deterministic fallback parser:', err);
    }
  }

  return intelligentFallbackParser(spokenText, context);
}
