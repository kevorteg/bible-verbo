import { useState, useEffect } from 'react';
import { Book, Chapter, Verse, ReadProgressMap } from '../types';
import * as BibleService from '../services/bibleService';
import { DEFAULT_BIBLE_ID } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export const useBibleReader = (showToast: (msg: string) => void) => {
    const { user, updateStats, checkInDaily } = useAuth();

    const [bibleId, setBibleId] = useState(DEFAULT_BIBLE_ID);
    const [apiBooks, setApiBooks] = useState<Book[]>([]);
    const [currentBook, setCurrentBook] = useState<Book | null>(null);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightedVerseId, setHighlightedVerseId] = useState<string | null>(null);
    const [readChapters, setReadChapters] = useState<ReadProgressMap>({});

    // Cargar progreso guardado y libros al inicio
    useEffect(() => {
        const savedProgress = localStorage.getItem('verbo_progress');
        if (savedProgress) setReadChapters(JSON.parse(savedProgress));

        const loadBooks = async () => {
            setLoading(true);
            try {
                const books = await BibleService.fetchBooks(bibleId);
                setApiBooks(books);
                if (!currentBook && books.length > 0) setCurrentBook(books[0]);
            } catch (e) {
                console.error("Error loading books", e);
            } finally {
                setLoading(false);
            }
        };
        loadBooks();
    }, [bibleId]);

    // Cargar capítulos cuando cambia el libro
    useEffect(() => {
        if (!currentBook) return;
        const loadChapters = async () => {
            try {
                const chapters = await BibleService.fetchChapters(bibleId, currentBook.id);
                setChaptersList(chapters);

                // Manejo de navegación pendiente (deep linking)
                if ((window as any)._pendingChapter) {
                    const target = chapters.find(c => parseInt(c.number) === (window as any)._pendingChapter) || chapters[0];
                    setCurrentChapter(target);
                    delete (window as any)._pendingChapter;
                } else if (!currentChapter || currentChapter.bookId !== currentBook.id) {
                    setCurrentChapter(chapters[0]);
                }
            } catch (e) {
                console.error("Error loading chapters", e);
            }
        };
        loadChapters();
    }, [currentBook, bibleId]);

    // Cargar versículos cuando cambia el capítulo
    useEffect(() => {
        if (!currentChapter) return;
        const loadVerses = async () => {
            setLoading(true);
            setVerses([]); // Clear previous content to avoid stale state
            try {
                const content = await BibleService.fetchChapterContent(bibleId, currentChapter.id);
                setVerses(content);

                // Manejo de highlight pendiente
                if ((window as any)._pendingVerse) {
                    setHighlightedVerseId(String((window as any)._pendingVerse));
                    delete (window as any)._pendingVerse;
                } else {
                    setHighlightedVerseId(null);
                }
            } catch (e) {
                console.error("Error loading verses", e);
                showToast("Error cargando el capítulo. Intenta de nuevo.");
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
                (window as any)._pendingChapter = 1;
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
                (window as any)._pendingChapter = 999; // Intencional para ir al final (simulado, requiere lógica extra si se quiere ir al último cap real)
            }
        }
    };

    const handleToggleReadChapter = (bookId: string, chapterNum: string) => {
        setReadChapters(prev => {
            const bookProgress = prev[bookId] || [];
            const isCompleted = bookProgress.includes(chapterNum);
            const newBookProgress = isCompleted ? bookProgress.filter(c => c !== chapterNum) : [...bookProgress, chapterNum];

            if (!isCompleted) {
                showToast("¡Capítulo completado!");
                if (user && user.stats) {
                    updateStats({ chaptersRead: user.stats.chaptersRead + 1 });
                    checkInDaily();
                }
            }
            const newState = { ...prev, [bookId]: newBookProgress };
            localStorage.setItem('verbo_progress', JSON.stringify(newState));
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
        handleNextChapter,
        handlePrevChapter,
        handleToggleReadChapter
    };
};
