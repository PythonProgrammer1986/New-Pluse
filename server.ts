import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { parseHuddleMeetingSpeech, ScribeContext } from './src/services/huddleScribeService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // AI Huddle Scribe endpoint
  app.post('/api/huddle-scribe', async (req, res) => {
    try {
      const { spokenText, context } = req.body || {};

      if (!spokenText || typeof spokenText !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "spokenText" field.' });
      }

      const defaultContext: ScribeContext = context || {
        widgets: [],
        projects: [],
        employees: []
      };

      const result = await parseHuddleMeetingSpeech(spokenText, defaultContext);
      return res.json(result);
    } catch (err: any) {
      console.error('Server error handling /api/huddle-scribe:', err);
      return res.status(500).json({
        error: 'Failed to process speech with AI Scribe',
        message: err.message || String(err)
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Serve app via Vite middlewares in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Epiroc Pulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
