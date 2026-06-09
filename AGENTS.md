# Verbo Bible — AGENTS.md

## Stack
- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 + `@tailwindcss/vite` (`index.css:1`)
- Supabase (auth + db), Gemini AI, API.Bible
- Leaflet (`components/MapPage.tsx:4`), html2canvas (`components/ShareModal.tsx:5`), ambos vía npm
- `vite-plugin-pwa` para PWA (manifest + service worker con Workbox)
- ESLint + Prettier + Vitest + React Testing Library configurados

## Comandos
- `npm run dev` — servidor en puerto 3001 con proxy local API
- `npm run build` — build Vite (genera PWA + service worker)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run test` — Vitest
- `npm run test:watch` — Vitest watch mode

## Variables de Entorno (`.env` — ver `.env.example`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_API_BIBLE_KEY=
VITE_ENCRYPTION_KEY=   # usada en encryptionService.ts (client-side)
GEMINI_API_KEY=        # usada en Edge Function y api/gemini.ts
API_BIBLE_KEY=         # usada en api/bible.ts (server-side)
ENCRYPTION_KEY=        # server-side (legacy, reemplazado por VITE_ENCRYPTION_KEY)
```

## Arquitectura
- **API routes**: `api/bible.ts` y `api/gemini.ts` — serverless functions para Vercel
- **Proxy local**: `vite.config.ts:14-73` — middleware que duplica las rutas API en dev
- **Edge Function**: `supabase/functions/verbo-heavy-ai/` — tareas pesadas (TTS, imágenes, podcast; autenticación JWT requerida)
- Llamada ligera → Vercel function (timeout 10s), llamada pesada → Edge Function
- **PWA**: Service worker generado por `vite-plugin-pwa` con precaching del app shell + runtime caching para API.Bible, audio, y Gemini
- **Env validation**: `index.tsx:5` llama `validateEnv()` al arranque

## Database
- **NO** usar `database_schema.sql` como verdad única — **el código real usa `profiles`**, no `users`
- `notes.encrypted_content` (no `notes.content`), `chat_history.encrypted_content` (no `message_text`)
- Schema actualizado incluye: `profiles`, `notes`, `bookmarks`, `chat_history`, `prayers`, `prayer_interactions`, `quiz_results`, con RLS policies
- Stats inline en `profiles.stats` (JSONB columna), no tabla separada

## Features Recientes
- **Audio Bible**: `components/AudioPlayer.tsx` + `services/bibleService.ts:fetchChapterAudio` — usa API.Bible audio endpoint con fallback a TTS de Gemini
- **Planes de Lectura**: `components/ReadingPlanPage.tsx` + `data/readingPlans.ts` — 4 planes (NT 30 días, Salmos 7 días, NT 1 año, Proverbios mensual)
- **Tarjetas de versículos**: `components/ShareModal.tsx` — genera imágenes con html2canvas, múltiples fondos
- **PWA**: Instalable en Android/iPhone/PC, offline caching configurado

## Patrones a Conocer
- `services/navigation.ts` — estado compartido para navegación deep-link (`setPendingVerse`, `setPendingChapter`, `parseBibleReference`)
- Super admin hardcodeado: `milife.ortega2000@gmail.com` en `authService.ts:113`
- Encriptación client-side con crypto-js, clave en `encryptionService.ts:7`
- Chat typewriter: actualiza estado palabra por palabra (`useChat.ts:109-114`)
- `@/` alias mapea a raíz del proyecto (`tsconfig.json:22-24`)
- AudioPlayer se abre desde botón flotante en Reader (esquina inferior derecha, icono de audífonos)

## Seguridad (CONOCIDO — no replica fixes)
- CORS `*` en api routes (Vercel functions)
- Números de líderes hardcodeados en `mj_info.ts:33-43`
- API keys aún como `VITE_` prefijo (visibles en cliente, mitigado vía proxy)
