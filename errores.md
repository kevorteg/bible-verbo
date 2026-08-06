# Analisis de Errores y Discrepancias en Verbo Bible

## Estado: Activo

---

## 1. Error de Categorias en la Pantalla de Sermones

### Resuelto
- **Mock data colores corregidos**: ID 4 (Ensenanza) ahora usa `#449BD1`, ID 5 (Motivacional) ahora usa `#F58634`.
- **Fondo de categorias inactivas**: Ahora usa `catColor + '18'` en vez de `colors.surfaceLow`, dando un tono pastel correspondiente a cada categoria.

### Integrado
- `leader-tools.tsx` reemplazado con dashboard funcional: grupos locales (AsyncStorage), top lectores con barras de progreso, feed de actividad, crear/salir de grupo.
- `index.tsx` Trivias Recientes ahora muestra ultimas 5 trivias con puntaje y barra de porcentaje.

### Pendiente
- Diferencia entre version web (`components/SermonsPage.tsx`) y movil (`app/(tabs)/sermones.tsx`): web usa Supabase, movil usa mock data estatico. Unificar cuando se integre backend.

---

## 2. Errores de Navegacion y Tab Bar (Expo Router)

### Resuelto
- **Chat movido a `app/(tabs)/profile.tsx`**: El chat de Verbo IA ya no es una tab separada. Ahora esta embebido directamente en el perfil como seccion expandible (collapsible).
- **5 tabs en barra**: Home, Biblia, Devociones, Sermones, Perfil. Ya no hay 6 tabs.

### Pendiente
- El archivo `app/(tabs)/chat.tsx` existe pero no aparece en la tab bar. Se puede eliminar o mantener como ruta accesible via deep link.

---

## 3. Paginas Incompletas (Resueltas)

### Resuelto
- Muro de Oracion: completo con Supabase CRUD, categorias, anonimo, testimonio, gamificacion.
- Leader Tools: funcional con grupos locales (AsyncStorage), top 5, actividad reciente, crear/salir.
- Trivias Recientes en Home: conectado con AsyncStorage, muestra ultimas 5 con puntaje y barra %.

### Cambios recientes adicionales
- Banner de recompensa diaria en Home: oculto cuando ya reclamado (`!alreadyClaimed` wrapper).
- `sermons.json`: todos los youtubeId `dQw4w9WgXcQ` (Rick Roll) reemplazados por IDs reales del canal IPUC Oficial via RSS feed.
- Toast: nuevo tipo `warning` con icono AlertTriangle y color rojo #E53935.

---

## 4. Inconsistencia de Convenciones de Codigo (AGENTS.md)

### No resoluble
- `export default` es requerido por Expo Router para las pantallas en `app/`. Es un conflicto tecnico con la regla de "exportaciones nombradas" de AGENTS.md.
- Se recomienda actualizar AGENTS.md para permitir `export default` en archivos de ruta de Expo Router.

---

## 5. Audio Bible

### Pendiente
- 1195 archivos MP3 en `C:\Users\Home\Desktop\DIOS\Biblia` (~1-3GB).
- Decision pendiente: copiar a `assets/` vs streaming desde API.Bible.
- Marcado como prioridad para el siguiente ciclo de desarrollo.

---

## 6. Gamificacion (Nuevo)

### Implementado
- `services/gamificationStorage.ts` - CRUD AsyncStorage
- `services/gamificationEngine.ts` - XP, niveles, combos, logros, tienda
- `services/leagueSystem.ts` - 7 ligas con bots, promocion/demision
- `hooks/useGamification.ts` - Hook que expone toda la logica
- `services/notificationService.ts` - Recordatorios de lectura y culto
- `components/Toast.tsx` - Banner animado tipo Duolingo (incluye tipo `warning` con AlertTriangle + rojo #E53935)
- `components/StreakIndicator.tsx` - Indicador visual de racha

### Integrado recientemente
- Gamificacion conectada al Reader: XP al marcar capitulo como leido, logros al completar libros.
- Tienda de monedas (`/store`) con daily deals, power-ups, y sistema de inventario.
- Gamificacion conectada al Profile con stats reales (XP, nivel, monedas, racha, ligas).
- Ligas con Top 3 visible en Profile y Home.
- Cofre de racha de 7 dias con rewards aleatorios.
- Logros ocultos (Intercesor, Madrugador, Evangelista, Cofre abierto).
- Muro de Oracion completo con categorias, testimonio, gamificacion (+5 XP por crear, +2 XP por orar, max 20 XP/dia).
- Devocional diario dinamico via API.Bible (ciclo anual por libros).
- Personalizacion del Lector: fondo (crema/oscuro/sepia/papel), tamano de letra, espaciado, tipografia (5 opciones).
- Dark mode en toda la app via ThemeContext.
- Metas Colectivas de Lectura: creacion de metas con milestones, contribution desde el Reader, soporte en Home.
- Trivias Recientes en Home: ultimas 5 trivias con puntaje, % y barra de progreso.
- Leader Tools funcional: grupos locales, top lectores, actividad reciente, miembros simulados.
- Notificaciones Push: plugin en app.json, handler foreground, toggle en Profile, canal Android.
- BackHandler.removeEventListener corregido a sub.remove() en Reader.
