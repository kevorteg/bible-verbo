# Verbo Bible

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

Verbo Bible es una app movil (iOS/Android) construida con React Native/Expo, disenada para transformar el estudio biblico mediante Inteligencia Artificial. No es solo un lector, es un companero de discipulado inteligente que combina tecnologia y espiritualidad.

## Caracteristicas Principales

**Lector Biblico Avanzado**
Interfaz limpia y rapida (Reina Valera 1909), con navegacion fluida, modos de lectura (claro/oscuro/sepia) y retos de lectura por capitulo completado.

**"Verbo" (Tu Mentor IA)**
Un asistente teologico basado en Google Gemini que responde dudas, analiza pasajes y te acompana, siempre con un enfoque doctrinal sano.

**Trivia Biblica (Quiz)**
- Generacion automatica de preguntas sobre el capitulo actual.
- Niveles: Explorador, Discipulo y Maestro.
- Tematicas: Historia, Teologia y Aplicacion Practica.
- Repaso de errores educativo.

**Grupos y Retos**
- Crear grupos con codigo de invitacion para compartir.
- Retos de lectura grupales con meta de capitulos y leaderboard en vivo.
- El avance de lectura se registra automaticamente al completar capitulos.

**Gamificacion**
Niveles, XP, rachas, logros, monedas, ligas semanales, tienda y mapa de progreso tipo journey.

**Biblia en Audio y VerboCast**
Escucha cualquier versiculo o explicacion de la IA con voces naturales (TTS) y podcast generado por IA.

**Localizador de Iglesias**
Encuentra congregaciones IPUC cercanas integradas con Google Maps.

## Tecnologias

- **Runtime**: Expo SDK 57 / React Native 0.86
- **Frontend**: React 19 + TypeScript strict mode
- **Navegacion**: expo-router (file-based routing)
- **Estilos**: NativeWind (Tailwind para RN)
- **Backend**: Supabase (auth, base de datos, storage)
- **IA Core**: Google Gemini (chat, TTS, imagenes, quiz)
- **Datos Biblicos**: API.Bible
- **Iconos**: lucide-react-native
- **Storage local**: @react-native-async-storage/async-storage

## Comandos

- Dev: `npx expo start`
- Lint: `npx expo lint`
- Build: `npx eas build --platform all`

## Base de datos

El esquema completo esta en `database_schema.sql`. Para la feature de Grupos y Retos se agregan las tablas `group_challenges` y `challenge_contributions` (seccion 12 y 13); si ya tienes una version anterior aplicada, ejecuta solo las sentencias `ALTER TABLE ADD COLUMN IF NOT EXISTS` de esa seccion.

---

Desarrollado con dedicacion para la edificacion del cuerpo de Cristo.
