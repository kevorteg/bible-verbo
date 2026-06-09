import { Book, Chapter } from '../types';

interface PendingState {
  verse: string | null;
  chapter: number | null;
}

const pending: PendingState = { verse: null, chapter: null };

export const setPendingVerse = (v: string | null) => { pending.verse = v; };
export const getAndClearPendingVerse = (): string | null => {
  const v = pending.verse;
  pending.verse = null;
  return v;
};

export const setPendingChapter = (c: number | null) => { pending.chapter = c; };
export const getAndClearPendingChapter = (): number | null => {
  const c = pending.chapter;
  pending.chapter = null;
  return c;
};

export interface BibleReference {
  book: Book | null;
  chapterNum: number;
  verseNum?: number;
}

// Normalize Spanish accented book names for matching
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const parseBibleReference = (text: string, apiBooks: Book[]): BibleReference | null => {
  const cleanText = text.replace(/[*_#]/g, '').trim();
  const bibleRegex = /([123]?\s?[a-z0-9áéíóúñ]+\s*[a-záéíóúñ]*)\s*(\d+)(?::(\d+))?/i;
  const match = cleanText.match(bibleRegex);

  if (!match || apiBooks.length === 0) return null;

  const rawBookName = match[1].toLowerCase().trim();
  const normalizedQuery = normalize(rawBookName);
  if (normalizedQuery.length < 2) return null;

  const chapterNum = parseInt(match[2]);
  const verseNum = match[3] ? parseInt(match[3]) : undefined;

  const foundBook = apiBooks.find((b) => {
    if (b.id.toLowerCase() === rawBookName) return true;
    return normalize(b.name).includes(normalizedQuery);
  });

  if (!foundBook) return null;

  return { book: foundBook, chapterNum, verseNum };
};
