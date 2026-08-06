# Verbo Bible - Design Brief v2 (Juvenil MJ)

## 1. Concepto General

Verbo Bible es una app de estudio biblico potenciada con IA para jovenes cristianos (18-30 anos) de Mision Juvenil IPUC. No es un lector generico de Biblia -- es una experiencia gamificada, vibrante y social que hace el discipulado algo adictivo.

Target: jovenes universitarios cristianos.
Plataforma: iOS y Android (Expo React Native).
Estilo: juvenil, gamificado, colores vibrantes, chunky 3D shadows, bento grids, nada de fondos blancos genericos.

## 2. Paleta de Color (MJ Material Design 3)

- surface-container-low: #f0f3ff (fondo principal azul hielo)
- background: #f9f9ff (fondo muy claro)
- primary: #805600 (ambar oscuro - texto sobre primary container)
- primary-container: #ffb000 (ambar brillante - botones, acentos)
- on-primary-container: #241a00 (texto sobre primary container)
- secondary: #0058be (azul oscuro)
- secondary-container: #2170e4 (azul brillante)
- tertiary: #006e2f (verde oscuro)
- tertiary-container: #41da70 (verde brillante - correcto, completado)
- surface-container-lowest: #ffffff (tarjetas, modales)
- surface-container-high: #dee8ff
- surface-container-highest: #d9e3f9
- surface-variant: #d9e3f9
- on-surface: #121c2c (texto principal)
- on-surface-variant: #524533 (texto secundario)
- outline: #847560
- outline-variant: #d7c4ac
- primary-fixed-dim: #ffba43
- sepia: #f4ecd8 (modo lectura sepia)

## 3. Tipografia

- Toda la app: Plus Jakarta Sans (weights 400, 500, 600, 700, 800)
- Versiculos opcional: Merriweather (selectable por el usuario en ajustes)
- Tamano de lectura ajustable: 14px - 36px
- Numeros de versiculo: Plus Jakarta Sans 600, color on-surface-variant

## 4. Iconografia

- Sistema: lucide-react-native (equivalente a Material Symbols del prototipo)
- Proporcion 24x24, strokeWidth 2, esquinas redondeadas
- Iconos clave:
  - Biblia: BookOpen (auto_stories en prototipo)
  - Chat IA: MessageCircle (smart_toy)
  - Perfil: User (person)
  - Mas: Ellipsis (more_vert)
  - Marcador: Bookmark (bookmark)
  - Nota: StickyNote (note)
  - Podcast: Headphones (podcasts)
  - Quiz: BrainCircuit (quiz)
  - Mapa: MapPin (location_on)
  - Sermones: Video (video_library)
  - Oracion: Heart (favorite)
  - Logo: cross + book (menu_book)

## 5. Estructura de Navegacion

### Bottom Tab Bar (floating pill style)
4 tabs con icono + label, barra flotante con fondo blanco y chunky shadow:

| Tab | Icono | Label | Pantalla |
|-----|-------|-------|----------|
| 1 | BookOpen | Biblia | Lector biblico |
| 2 | MessageCircle | Verbo | Chat con IA |
| 3 | User | Perfil | Dashboard personal |
| 4 | Ellipsis | Mas | Menu secundario |

La tab bar es un pill flotante (esquinas redondeadas 32px, sombra 3D, fondo blanco). El tab activo tiene icono en primary-container (#ffb000) y label en primary (#805600). Inactivos en on-surface-variant (#524533).

El tab "Mas" abre bottom sheet con iconos grandes estilo bento grid:
- Juegos/Trivia (BrainCircuit)
- Sermones (Video)
- Mapa Iglesias (MapPin)
- Admin (Shield) solo admin
- Lideres (Users) solo lider
- Muro de Oracion (Heart)

### Navigation Stack
Cada tab con stack navigator propio. Headers con fondo surface-container-low, titulo Plus Jakarta Sans 700. Gestos de back nativo.

## 6. Pantallas Detalladas

### 6.1 Lector Biblico (Pantalla principal - Tab 1)

Layout tipo bento grid:

- Header: icono menu (sidebar libros), nombre libro, selector de capitulo (boton con numero actual), botones de accion (Headphones, MessageCircle, ajustes)
- Book Selector: scroll horizontal de libros como chips/cards con icono + nombre. Categoria del libro indicada por barra de color izquierda (azul Pentateuco, verde Historial, etc.)
- Chapter Selector: grid 4 columnas de circulos numerados. Cada circulo muestra estado:
  - Completado: circulo verde (#41da70) con check mark
  - Actual/en progreso: circulo ambar (#ffb000) con numero
  - Bloqueado: circulo outline-variant con numero gris
  - Normal: circulo borde sutil con numero
- Chapter Stats: barra con iconos de ojo (leido), rayo (XP ganada), reloj (tiempo)
- Versiculos: FlatList con scroll infinito. Cada verso con numero a la izquierda (small, on-surface-variant). Tap selecciona verso con highlight suave.
- Bottom actions: botones grandes con chunky shadow -- "Reflexionar" (primary-container) y "Marcar como leido" (tertiary-container)
- Progress bar debajo de versiculos: barra con gradiente, inner highlight para efecto 3D
- Floating miniplayer para VerboCast si hay audio reproduciendose

### 6.2 Chat con Verbo IA (Tab 2)

- Header: "Verbo" titulo, boton info (contexto actual libro/capitulo), boton limpiar
- Burbujas: IA a la izquierda (surface-container-high), usuario a la derecha (primary-container)
- Typewriter effect para respuestas IA
- Quick reply chips: rounded-full, fondo surface-container-high, borde sutil
- Input area flotante con chunky shadow: input redondeado + boton enviar (primary-container circle) + microfono
- Action buttons arriba del input: camara, imagen (generar arte), podcast, ubicacion
- Deteccion de citas: chips "Ir a [Libro Cap:Verso]" que navegan al lector
- Elementos decorativos: blobs de fondo suaves (opacidad baja)

### 6.3 Perfil / Dashboard (Tab 3)

No logueado:
- Ilustracion 3D (libro/personaje)
- Boton "Iniciar Sesion" primary-container con chunky shadow
- Boton "Registrarse" outline
- Texto: "Registrate para guardar tu progreso"

Logueado:
- Avatar circular grande con nivel superpuesto (circulo con numero y shadow)
- Nombre de usuario + email
- Stats row: 3 bento cards con icono + numero + label (Capitulos, Racha, XP)
- Progreso de lectura: lista de libros con barra de progreso (nombre libro, progreso "5/50", barra coloreada)
- Journey map: timeline visual de logros/lectura con nodos conectados por linea
- Logros: cards horizontales con icono, titulo, progreso circular
- Marcadores recientes: lista con versiculo + preview texto
- Notas recientes: lista con versiculo + preview texto
- Fondo con elementos decorativos suaves

### 6.4 Auth Flow

Pantalla Welcome/Login:
- Logo Verbo grande centrado (icono book + cross)
- Titulo "Verbo" en Plus Jakarta Sans 800
- Ilustracion decorativa 3D
- Botones de redes sociales (Google, Apple) con icono + "Continuar con..."
- Divider "o" con lineas
- Input email (icono a la izquierda, fondo surface-container-high, rounded-2xl)
- Input password (toggle visibility)
- Boton "Iniciar Sesion" primary-container full width con chunky shadow
- Link "Registrarse" y "Olvide mi contrasena"
- Background decorative blobs

Register:
- Inputs: nombre, email, password, confirmar password
- Boton "Crear Cuenta"
- Terminos y condiciones link

OTP:
- "Ingresa el codigo de verificacion"
- 6 cuadros de digitos estilo pin
- Boton "Verificar"

### 6.5 VerboCast (Podcast)

Producer screen:
- Header con icono podcast + titulo
- Selector ORIGEN: capitulo/versiculo con chips
- Selector ESTILO: 3 chips visuales (Divertido MJ con icono, Teologico, Meditativo)
- Boton grande "Producir Episodio" con chunky shadow y estado de carga (pulsating animation)
- Cover art con icono Headphones grande

Player:
- Floating miniplayer con chunky shadow: cover art pequeno, titulo, seek bar minimal, Play/Pause, X close
- Full player: cover art grande, seek bar con tiempo, -10s/Play/Pause/+10s, velocidad (1x, 1.5x, 2x), download

### 6.6 Quiz / Trivia

Bottom sheet:
- Header: titulo "Quiz", nombre libro/capitulo, dificultad (chips Facil/Medio/Dificil)
- Progress bar con 3D depth
- Pregunta en texto grande
- Opciones: botones grandes con chunky shadow (estilo inactive). Al seleccionar: verde (correcto) con glow, rojo (incorrecto) con shake
- Explicacion debajo de la respuesta
- Siguiente boton
- Resultado final: score, XP ganada, logro desbloqueado

### 6.7 Mapa de Iglesias

- Mapa a pantalla completa
- Marcadores personalizados (color primary-container con shadow)
- Bottom sheet con info de iglesia: nombre, direccion, boton "Como llegar"
- FAB para centrar en ubicacion actual

### 6.8 Muro de Oracion

- Feed vertical estilo chat/timeline
- Cada peticion: avatar, nombre, timestamp, categoria (chip coloreado), contenido
- Boton "Ore por esto" con contador y animacion de heart
- FAB para crear peticion (primary-container con chunky shadow)
- Modal de creacion: input de texto, selector de categoria

### 6.9 Otras Pantallas

- Sermones: Collection view con thumbnails, titulo, predicador, duracion
- Admin: tabla usuarios con swipe actions
- Leader Tools: formulario para dinamicas IA

## 7. Componentes Reutilizables

### Chunky Button
- Fondo primary-container o tertiary-container
- margin-bottom: 8px (espacio para la shadow)
- box-shadow equivalente: 0px 8px 0px rgba(0,0,0,0.05)
- Esquinas redondeadas 16px
- Estado press: translateY(4px), shadow reducida a 4px
- Texto en bold, color on-primary-container

### Bento Card
- Fondo surface-container-lowest (blanco)
- Esquinas redondeadas 16px
- Chunky shadow
- Opcional: barra de color izquierda (4px width)
- Padding 16px interno
- Icono + titulo + subtitulo

### Circular Chapter Button
- Diametro 48px
- Borde sutil (outline-variant)
- Estados: completado (fill tertiary-container + check icon), actual (fill primary-container), bloqueado (opacidad reducida)
- Numeros en Plus Jakarta Sans 600

### Progress Bar
- Altura 8-12px
- Fondo surface-container-high
- Fill con gradiente o color solido
- Inner highlight (white con opacidad 30%) para efecto 3D
- Esquinas redondeadas full

### Bottom Sheet
- Gesture drag down para cerrar
- Backdrop semi-transparente
- Grip bar centrada
- Esquinas superiores redondeadas 16px
- Contenido scrollable

### Floating Pill Nav
- Fondo white
- Esquinas redondeadas 32px
- Chunky shadow
- Altura 60px
- Iconos 24x24, label 10px
- Tab activo: primary-container icon + primary text

### Decorative Blob
- Circulos/elipses con opacidad baja (5-10%)
- Colores accent (primary-container, secondary-container, tertiary-container)
- Posicion absoluta como fondo
- Sin borde

## 8. Animaciones

- Press: translateY(4px) + shadow reduction (80ms spring)
- Screen transitions: iOS default slide from right
- Bottom sheet: spring animation desde abajo
- Typewriter: palabras cada 20ms
- Quiz correcto: glow + check animation
- Quiz incorrecto: shake animation
- Progress bar: smooth width transition
- Loading: shimmer skeleton, pulsing podcast icon, 3 dots bouncing
- Like/bookmark: scale pop animation
- Dark/sepia mode: crossfade 300ms

## 9. Estados de Carga y Error

- Loading versiculos: skeleton shimmer con color surface-container-high
- Loading chat: 3 dots bouncing en burbuja IA
- Error red: toast "Sin conexion" con retry icon
- Empty state: ilustracion + mensaje + accion CTA
- Quiz loading: spinner ambar + "Generando preguntas..."
- Podcast loading: pulsing icon + "Produciendo episodio..."

## 10. Layout Responsivo

- iPhone SE: fuente 14-16px, padding reducido, grid 3 columnas
- iPhone normal: fuente 16-18px, padding 16px, grid 4 columnas
- iPhone Pro Max: fuente 18-20px, mas aire, grid 4-5 columnas
- iPad: sidebar con lista de libros en split, grid expandido
- Landscape: tab bar mas compacto, layout de dos paneles en lector

## 11. Referencias Visuales

- Prototipos HTML del diseno base (provistos por el usuario)
- Material Design 3 (sistema de colores roles, elevation)
- Duolingo (gamificacion, streaks, niveles)
- Apple Books (modo lectura, temas, transiciones)
- iMessage (burbujas de chat)

## 12. Assets a Crear

- Logo Verbo: "V" estilizada con book/cross (formato SVG/PDF)
- Splash screen: logo + gradiente azul hielo a ambar
- Ilustraciones 3D: personajes juveniles, libros, arboles, etc.
- Icono app: esquinas redondeadas, fondo azul, logo blanco
- Background blobs para decoracion de fondos
