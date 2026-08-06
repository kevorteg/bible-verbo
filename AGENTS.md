# Verbo Bible - Reglas del Proyecto

## Stack
- Runtime: Expo SDK 57+ / React Native 0.86
- Lenguaje: TypeScript strict mode
- Navegacion: expo-router (file-based routing)
- Estilos: NativeWind (Tailwind para RN)
- Animaciones: react-native-reanimated
- Iconos: lucide-react-native
- Backend: Supabase (auth, db, storage)
- IA: Google Gemini via @google/genai
- Mapas: react-native-maps + expo-location
- Hapticos: expo-haptics
- Notificaciones: expo-notifications
- WebView: react-native-webview
- Uploads: @vercel/blob
- Storage local: @react-native-async-storage/async-storage
- Logros/confeti: react-native-confetti-cannon

## Prohibiciones estrictas
- NO usar emojis en ningun archivo de codigo, comentarios, commits, ni documentos
- NO agregar comentarios al codigo a menos que sea estrictamente necesario para entender logica no obvia
- NO usar nombres de variables en espanol (excepto textos visibles al usuario)
- NO usar librerias que no esten en la lista del stack sin preguntar
- NO escribir codigo sin tipado TypeScript explicito

## Convenciones de codigo
- Nombres de archivos en PascalCase para componentes y screens: `ReaderScreen.tsx`, `ChatScreen.tsx`
- Nombres de archivos en camelCase para hooks, servicios, utilidades: `useBibleReader.ts`, `geminiService.ts`
- Exportaciones nombradas, no default exports
- Props explicitas con interfaces, no `React.FC` generico
- Estilos con NativeWind (clases Tailwind), no StyleSheet.create a menos que sea dinamico
- Animaciones con Reanimated, no Animated API legacy

## Arquitectura de la app Expo
```
app/
  _layout.tsx          // Root: AuthProvider, ThemeProvider, gesture handler
  (tabs)/
    _layout.tsx        // Bottom tab navigator iOS-style translucido
    index.tsx          // HomeScreen (dashboard, progreso, metas colectivas, explorar, trivias)
    biblia.tsx         // BibliaScreen (indice de libros/capitulos)
    chat.tsx           // ChatScreen (conversacion con Verbo IA)
    devociones.tsx     // DevocionesScreen (devocionales diarios)
    sermones.tsx       // SermonesScreen (lista de sermones)
    profile.tsx        // ProfileScreen (dashboard, stats, liga, tienda, logros)
  reader.tsx           // ReaderScreen (lector biblico, registra retos y log de grupo)
  groups.tsx           // GroupsScreen (grupos con codigo + retos + leaderboard)
  collective-goals.tsx // Metas colectivas
  games.tsx            // Trivia y juegos
  store.tsx            // Tienda de items (customization)
  verbocast.tsx        // VerboCast (podcast IA)
  audio-bible.tsx      // Biblia en audio (TTS)
  sermon-player.tsx    // Reproductor de video de sermon
  map.tsx              // Mapa de iglesias IPUC
  prayer-wall.tsx      // Muro de oracion
  leader-tools.tsx     // Herramientas para lideres
  edit-profile.tsx     // Edicion de perfil
  auth/
    login.tsx          // Login con email/password
    register.tsx       // Registro
  admin/
    index.tsx          // Admin dashboard
services/              // Logica de negocio
  supabaseClient.ts    // Cliente Supabase
  authService.ts       // Auth Supabase
  userService.ts       // CRUD usuarios, notas, favoritos, chat
  bibleService.ts      // API.Bible
  geminiService.ts     // Gemini AI (chat, TTS, imagenes, quiz)
  aiFeatures.ts        // Podcast, recomendaciones
  triviaService.ts     // Generacion de preguntas y scoring
  gamificationEngine.ts / gamificationStorage.ts // XP, niveles, logros, monedas
  leagueSystem.ts      // Ligas semanales
  collectiveGoals.ts   // Metas colectivas
  groupService.ts      // Grupos (crear, unirse por codigo, log de lectura)
  challengeService.ts  // Retos grupales (crear, contribuir, leaderboard)
  prayerService.ts     // Muro de oracion
  churchService.ts / mapWebService.ts // Iglesias IPUC + Google Maps
  dailyDevotional.ts   // Devocional diario
  audioBibleService.ts // TTS de la Biblia
  sermonDataService.ts // Sermones
  notificationService.ts // Notificaciones
  favoritesService.ts  // Capitulos favoritos
  encryptionService.ts // Cifrado cliente (crypto-js)
  readerSettings.ts    // Ajustes de lectura
  vercelBlobService.ts // Uploads (Vercel Blob)
  audioUtils.ts        // Utilitarios de audio
  avatarData.ts / characterData.ts // Datos de avatares y personajes
  routingService.ts    // Navegacion programatica
hooks/
  useBibleReader.ts
  useChat.ts
  useQuiz.ts
  useAchievements.ts
  useGamification.ts
  useAudioBible.ts
contexts/
  AuthContext.tsx      // Contexto de autenticacion
  ThemeContext.tsx     // Contexto de tema (claro/oscuro/sepia) + paleta
  CharacterContext.tsx // Personaje seleccionado
components/            // Componentes reutilizables UI (Reader, Sidebar, Toast, etc.)
```

## Diseno juvenil, vibrante, gamificado (MJ brand)
- Bottom tab bar flotante tipo pill con fondo blanco, chunky shadow, 4 tabs (Biblia, Verbo, Perfil, Mas)
- Navigation stack con push/pop y gesto de back nativo
- Modales y bottom sheets con esquinas redondeadas 16px y chunky shadow
- Tipografia: Plus Jakarta Sans en toda la app (variable weight)
- Iconos: lucide-react-native (con mapping desde Material Symbols del prototipo)
- Paleta MJ: fondo azul hielo #f0f3ff, primary ambar #ffb000/#805600, secondary azul #2170e4/#0058be, tertiary verde #41da70/#006e2f, texto #121c2c, sepia #f4ecd8
- Chunky 3D shadows: box-shadow 0px 8px 0px rgba(0,0,0,0.05) en botones y cards, translateY(4px) + shadow reducida al presionar
- Bento grid layout para selectores de libro/capitulo
- Cards con barra de color izquierda (accent verde/azul/ambar) y chunky shadow
- Esquinas redondeadas: default 16px, lg 32px, xl 48px
- Gamificacion: niveles, XP, rachas, logros, monedas, mapa de progreso tipo journey
- Fondos siempre coloridos: sin blancos genericos, usar surface tint azul #f0f3ff o sepia #f4ecd8
- Dark mode + sepia mode
- Elementos decorativos: blobs de fondo, ilustraciones 3D flotantes
- Haptic feedback en interacciones clave (seleccion, marcador, quiz)
- Miniplayer flotante con chunky shadow para VerboCast
- Sin bordes innecesarios en la UI (excepto barras de color decorativas)

## Comandos
- Dev: `npx expo start`
- Build: `npx eas build --platform all`
- Lint: `npx expo lint`

## MCP disponible
Usar `codebase-memory-mcp` para consultas estructurales sobre el codigo:
- `search_graph` para encontrar funciones, componentes, tipos
- `trace_path` para seguir cadenas de llamadas
- `get_architecture` para vista general de la arquitectura
- `query_graph` para consultas Cypher avanzadas

## Flujo de trabajo
1. Siempre preguntar antes de cambiar la estructura de archivos
2. Las pantallas nuevas van en `app/` con expo-router
3. La logica compartida va en `services/` o `hooks/`
4. Los componentes reutilizables van en `components/`
5. No tocar `types.ts` sin coordinar cambios
6. Cada pantalla debe ser responsiva: iPhone SE hasta iPad
