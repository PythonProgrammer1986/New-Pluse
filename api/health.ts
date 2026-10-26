export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasKey = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY
  );

  const matchedVar = process.env.GEMINI_API_KEY
    ? 'GEMINI_API_KEY'
    : process.env.GOOGLE_API_KEY
    ? 'GOOGLE_API_KEY'
    : process.env.VITE_GEMINI_API_KEY
    ? 'VITE_GEMINI_API_KEY'
    : process.env.GEMINI_KEY
    ? 'GEMINI_KEY'
    : null;

  return res.status(200).json({
    status: 'ok',
    environment: 'vercel-serverless',
    hasGeminiKey: hasKey,
    keyVarName: matchedVar,
    timestamp: new Date().toISOString()
  });
}
