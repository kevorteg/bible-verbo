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
VITE_ENCRYPTION_KEY=   # usada en encryptionService.ts (client-side) — OBLIGATORIO en Vercel
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
- **Audio Bible**: `components/AudioPlayer.tsx` — `<audio>` unificado para API.Bible + TTS fallback; play/pause/timeline seek; `onVerseChange` callback sincroniza con Reader (highlight + scroll automático). `AUDIO_BIBLE_ID` en `constants.ts` (NTV para audio). `services/geminiService.ts:generateSpeechBlob` convierte TTS PCM → WAV Blob URL.
- **Sync Audio ↔ Reader**: `Reader` recibe `currentAudioVerse` prop → resalta el versículo (borde naranja + fondo) y hace scroll. Estado en `App.tsx` via `setCurrentAudioVerse`.
- **PWA via `vite-plugin-pwa`**: `vite.config.ts` — manifest + Workbox precache (6 entradas) + runtime caching para API.Bible, audio, Gemini. Sin `public/manifest.json`.
- **Planes de Lectura**: `components/ReadingPlanPage.tsx` + `data/readingPlans.ts` — 4 planes con progreso en localStorage. Botón en sidebar (`'plans'` view).
- **Tarjetas de versículos**: `components/ShareModal.tsx` — html2canvas via npm (migrado de CDN).
- **Sin emojis**: Política estricta — 0 emojis en UI. Lucide icons en su lugar.
- **Audio MP3 Local**: `data/audioBooks.ts` — 66 libros clasificados en 2 testamentos, 10 secciones. `services/localAudioService.ts` — resuelve libro+capítulo → ruta `/audio/Biblia/...`. Fallback: local → API.Bible → Gemini TTS.
- **AudioLibrary**: `components/AudioLibrary.tsx` — panel modal con búsqueda, testamentos colapsables, secciones, libros, capítulos, progreso por capítulo (check en localStorage), botón en Sidebar (`'Audios'`).
- **AudioPlayer mejorado**: Botones prev/next capítulo, botón "Biblioteca" que abre AudioLibrary, soporta reproducción desde Reader (con versos) o desde Library (solo MP3).

## Patrones a Conocer
- `services/navigation.ts` — estado compartido para navegación deep-link (`setPendingVerse`, `setPendingChapter`, `parseBibleReference`)
- Super admin hardcodeado: `milife.ortega2000@gmail.com` en `authService.ts:113`
- Encriptación client-side con crypto-js, clave en `encryptionService.ts:7`
- Chat typewriter: actualiza estado palabra por palabra (`useChat.ts:109-114`)
- `@/` alias mapea a raíz del proyecto (`tsconfig.json:22-24`)
- AudioPlayer se abre desde botón flotante en Reader (esquina inferior derecha, icono de audífonos)
- AudioPlayer state machine: `loading` → `paused` → `playing`/`paused` (toggle) → `error`. Ambos modos (API.Bible + TTS) usan el mismo `<audio>` element.
- `AUDIO_BIBLE_ID` separado de `DEFAULT_BIBLE_ID` — texto se lee en RV1909, audio se reproduce en NTV
- Sin emojis en UI — solo Lucide icons (`lucide-react`)
- Audio MP3 local: `static/audio/Biblia/{N°} - {NombreLibro}/{capítulo}-{NombreSinAcentos}.mp3`. Carpeta con 66 libros (~3GB). **No está en `public/`** — se sirve vía middleware en dev (`vite.config.ts:70-83`). Para producción, desplegar separadamente.
- `data/audioBooks.ts` contiene la clasificación: 2 testamentos, 10 secciones, 66 libros con capítulos exactos.
- `services/localAudioService.ts:getLocalAudioUrl` construye la ruta del MP3 local. `normalizeBookName` quita acentos (NFD).
- Fallback: local → API.Bible → Gemini TTS. Cada fuente se prueba secuencialmente por `AudioPlayer`.
- `AudioLibrary` es un modal z-[100] que se abre desde sidebar o desde botón "Biblioteca" en AudioPlayer.
- Progreso de escucha guardado en localStorage (`verbo_audio_progress`) como Set de "bookNum:chapterNum".

## Seguridad (CONOCIDO — no replica fixes)
- CORS `*` en api routes (Vercel functions)
- Números de líderes hardcodeados en `mj_info.ts:33-43`
- API keys aún como `VITE_` prefijo (visibles en cliente, mitigado vía proxy)
