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
  avatar?: string;
  joinedDate: string;
  role?: 'user' | 'admin' | 'leader';
  isVerified?: boolean;
  location?: { lat: number; lng: number };
  stats?: {
    chaptersRead: number;
    notesCount: number;
    streakDays: number;
    lastActivityDate?: string;
    achievements?: Achievement[];
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
  has_prayed?: boolean;
  testimony?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  dateUnlocked: string;
  type: 'expert' | 'troll' | 'honor';
}

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  duration: string;
}
