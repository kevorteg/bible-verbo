import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, Chapter, Verse, ReadProgressMap } from '../types';
import * as BibleService from '../services/bibleService';
import { DEFAULT_BIBLE_ID } from '../constants';
import { useAuth } from '../contexts/AuthContext';

let pendingBookId: string | null = null;
let pendingChapter: number | null = null;
let pendingVerse: number | null = null;

export const setPendingNavigation = (bookId?: string, chapter?: number, verse?: number) => {
  if (bookId) pendingBookId = bookId;
  if (chapter) pendingChapter = chapter;
  if (verse) pendingVerse = verse;
};

export const useBibleReader = () => {
  const { user, updateStats, checkInDaily } = useAuth();

  const [bibleId, setBibleId] = useState(DEFAULT_BIBLE_ID);
  const progressKey = `verbo_progress_${bibleId}`;
  const [apiBooks, setApiBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedVerseId, setHighlightedVerseId] = useState<string | null>(null);
  const [readChapters, setReadChapters] = useState<ReadProgressMap>({});

  useEffect(() => {
    const savedProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(progressKey);
        if (saved) setReadChapters(JSON.parse(saved));
      } catch {}
    };
    savedProgress();

    const loadBooks = async () => {
      setLoading(true);
      try {
        const books = await BibleService.fetchBooks(bibleId);
        setApiBooks(books);

        if (pendingBookId) {
          const target = books.find(b => b.id === pendingBookId);
          if (target) {
            setCurrentBook(target);
            pendingBookId = null;
          }
        } else if (!currentBook && books.length > 0) {
          setCurrentBook(books[0]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, [bibleId]);

  useEffect(() => {
    if (!currentBook) return;
    const loadChapters = async () => {
      try {
        const chapters = await BibleService.fetchChapters(bibleId, currentBook.id);
        setChaptersList(chapters);

        if (pendingChapter) {
          const target = chapters.find(c => parseInt(c.number) === pendingChapter) || chapters[0];
          setCurrentChapter(target);
          pendingChapter = null;
        } else if (!currentChapter || currentChapter.bookId !== currentBook.id) {
          setCurrentChapter(chapters[0]);
        }
      } catch {}
    };
    loadChapters();
  }, [currentBook, bibleId]);

  useEffect(() => {
    if (!currentChapter) return;
    const loadVerses = async () => {
      setLoading(true);
      setVerses([]);
      try {
        const content = await BibleService.fetchChapterContent(bibleId, currentChapter.id);
        setVerses(content);

        if (pendingVerse) {
          setHighlightedVerseId(String(pendingVerse));
          pendingVerse = null;
        } else {
          setHighlightedVerseId(null);
        }
      } catch {
        // error handled upstream
      } finally {
        setLoading(false);
      }
    };
    loadVerses();
  }, [currentChapter, bibleId]);

  const handleNextChapter = () => {
    setHighlightedVerseId(null);
    const idx = chaptersList.findIndex(c => c.id === currentChapter?.id);
    if (idx < chaptersList.length - 1) {
      setCurrentChapter(chaptersList[idx + 1]);
    } else {
      const bookIdx = apiBooks.findIndex(b => b.id === currentBook?.id);
      if (bookIdx < apiBooks.length - 1) {
        setCurrentBook(apiBooks[bookIdx + 1]);
        pendingChapter = 1;
      }
    }
  };

  const handlePrevChapter = () => {
    setHighlightedVerseId(null);
    const idx = chaptersList.findIndex(c => c.id === currentChapter?.id);
    if (idx > 0) {
      setCurrentChapter(chaptersList[idx - 1]);
    } else {
      const bookIdx = apiBooks.findIndex(b => b.id === currentBook?.id);
      if (bookIdx > 0) {
        setCurrentBook(apiBooks[bookIdx - 1]);
      }
    }
  };

  const reloadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(progressKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setReadChapters(parsed);
        return parsed;
      }
    } catch {}
    return null;
  };

  const handleToggleReadChapter = (bookId: string, chapterNum: string) => {
    setReadChapters(prev => {
      const bookProgress = prev[bookId] || [];
      const isCompleted = bookProgress.includes(chapterNum);
      const newBookProgress = isCompleted
        ? bookProgress.filter(c => c !== chapterNum)
        : [...bookProgress, chapterNum];

      if (!isCompleted && user?.stats) {
        updateStats({ chaptersRead: user.stats.chaptersRead + 1 });
        checkInDaily();
      }

      const newState = { ...prev, [bookId]: newBookProgress };
      AsyncStorage.setItem(progressKey, JSON.stringify(newState));
      return newState;
    });
  };

  return {
    bibleId, setBibleId,
    apiBooks,
    currentBook, setCurrentBook,
    currentChapter, setCurrentChapter,
    chaptersList,
    verses,
    loading,
    highlightedVerseId, setHighlightedVerseId,
    readChapters,
    reloadProgress,
    handleNextChapter,
    handlePrevChapter,
    handleToggleReadChapter,
  };
};
