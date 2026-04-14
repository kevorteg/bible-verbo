import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: 'localhost',
      },
      plugins: [
        react(),
        {
          name: 'local-api-proxy',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              
              if (url.pathname === '/api/bible') {
                const bPath = url.searchParams.get('path');
                console.log(`[Local API] Bible hit: ${bPath}`);
                const API_KEY = env.VITE_API_BIBLE_KEY || env.API_BIBLE_KEY || "";
                
                if (!bPath) return next();

                try {
                  const apiRes = await fetch(`https://rest.api.bible/v1/bibles${bPath}`, {
                    headers: { 'api-key': API_KEY }
                  });
                  const data = await apiRes.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return;
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Local Proxy Error' }));
                  return;
                }
              }

              if (url.pathname === '/api/gemini') {
                console.log(`[Local API] Gemini hit`);
                const GEMINI_KEY = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "";
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                  try {
                    const parsedBody = JSON.parse(body);
                    const model = parsedBody.model === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : parsedBody.model;
                    console.log(`[Local API] Gemini Model: ${model}`);
                    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents: parsedBody.contents,
                        generationConfig: parsedBody.config
                      })
                    });
                    const data = await apiRes.json();
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  } catch (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Local Gemini Error' }));
                  }
                });
                return;
              }
              next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
