import { parseHuddleMeetingSpeech, ScribeContext } from '../src/services/huddleScribeService';

export default async function handler(req: any, res: any) {
  // Enable CORS if accessed across subdomains
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { spokenText, context } = req.body || {};

    if (!spokenText || typeof spokenText !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "spokenText" parameter.' });
    }

    const defaultContext: ScribeContext = context || {
      widgets: [],
      projects: [],
      employees: []
    };

    const result = await parseHuddleMeetingSpeech(spokenText, defaultContext);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/huddle-scribe serverless function:', error);
    return res.status(500).json({
      error: 'Failed to process spoken text.',
      details: error.message || String(error)
    });
  }
}
