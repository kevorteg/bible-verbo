import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: 'localhost',
      },
      plugins: [
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: { enabled: false },
          includeAssets: ['assets/*.png'],
          manifest: {
            name: 'Verbo Biblia',
            short_name: 'Verbo',
            description: 'Lee la Biblia, escucha audios, estudia con IA y comparte versículos',
            start_url: '/',
            display: 'standalone',
            background_color: '#0a192f',
            theme_color: '#0a192f',
            orientation: 'portrait',
            lang: 'es',
            icons: [
              { src: '/assets/verbo_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              { src: '/assets/logo2.png', sizes: '541x541', type: 'image/png', purpose: 'any' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/rest\.api\.bible\/v1\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-bible-cache',
                  expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
                  networkTimeoutSeconds: 5,
                },
              },
              {
                urlPattern: /^https:\/\/www\.bible\.com\/audio\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'bible-audio-cache',
                  expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'gemini-cache',
                  expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                  networkTimeoutSeconds: 8,
                },
              },
            ],
          },
        }),
        {
          name: 'local-api-proxy',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

              if (url.pathname.startsWith('/audio/Biblia/')) {
                const filePath = path.join(__dirname, 'static', url.pathname);
                const fs = await import('fs');
                if (fs.existsSync(filePath)) {
                  const ext = path.extname(filePath).toLowerCase();
                  const mime = ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream';
                  res.writeHead(200, { 'Content-Type': mime, 'Accept-Ranges': 'bytes' });
                  const stream = fs.createReadStream(filePath);
                  stream.pipe(res);
                  return;
                }
                res.writeHead(404);
                res.end();
                return;
              }
              
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
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
