
export interface BibleVersion {
  name: string;
  id: string;
}

export interface Book {
  id: string;
  name: string;
  bibleId: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: string;
}

export interface Verse {
  id: string;
  number: string;
  text: string;
}

export interface ChatMessage {
  id: number | string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  image?: string;
}

export interface Bookmark extends Verse {
  bookName: string;
  chapterNum: string;
}

export type NoteMap = Record<string, string>;

// Mapa de lectura: BookID -> Array de números de capítulos leídos
export type ReadProgressMap = Record<string, string[]>;

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type QuizDifficulty = 'facil' | 'medio' | 'dificil';
export type QuizTopic = 'general' | 'historia' | 'teologia' | 'aplicacion';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // Base64 string
  joinedDate: string;
  role?: 'user' | 'admin' | 'leader'; // NUEVO: Rol para moderación
  isVerified?: boolean; // NUEVO: Estado de verificación
  location?: { lat: number; lng: number };
  stats?: {
    chaptersRead: number;
    notesCount: number;
    streakDays: number;
    lastActivityDate?: string;
  };
}

export type Theme = 'dark' | 'light' | 'sepia';

export interface BibleApiResponse<T> {
  data: T;
}

export interface BibleContentNode {
  type: string;
  name?: string;
  attrs?: { number?: string; style?: string };
  items?: BibleContentNode[];
  text?: string;
  verseId?: string;
}

export interface ChurchLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

// NUEVO: Interfaces para el Muro de Clamor
export interface PrayerRequest {
  id: string;
  user_id: string;
  author_name: string;
  avatar_url?: string;
  content: string;
  category: 'Salud' | 'Estudios' | 'Espiritual' | 'Familia' | 'Otros';
  is_anonymous: boolean;
  prayed_count: number;
  created_at: string;
  has_prayed?: boolean; // Estado local para saber si yo ya oré
  testimony?: string; // NUEVO: Si existe, es que ya fue respondida
}
