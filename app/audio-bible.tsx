import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Play, Pause, BookOpen } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAudioBible } from '../hooks/useAudioBible';
import * as BibleService from '../services/bibleService';
import { DEFAULT_BIBLE_ID } from '../constants';
import { setBooksOrder } from '../services/audioBibleService';
import { Book, Chapter } from '../types';

export default function AudioBibleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book?: string; chapter?: string }>();
  const { colors } = useTheme();
  const { isPlaying, position, duration, isLoading: audioLoading, error, loadAudio, togglePlayPause, seek, pause } = useAudioBible();

  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await BibleService.fetchBooks(DEFAULT_BIBLE_ID);
        setBooks(b);
        setBooksOrder(b);
        if (params.book) {
          const target = b.find((bk) => bk.id === params.book);
          if (target) {
            setSelectedBook(target);
            const c = await BibleService.fetchChapters(DEFAULT_BIBLE_ID, target.id);
            setChapters(c);
            if (params.chapter) {
              const targetCh = c.find((ch) => ch.id === params.chapter);
              if (targetCh) {
                setSelectedChapter(targetCh);
                loadAudio(target.id, targetCh.id);
              }
            }
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    try {
      const c = await BibleService.fetchChapters(DEFAULT_BIBLE_ID, book.id);
      setChapters(c);
    } catch {}
  };

  const handleSelectChapter = (ch: Chapter) => {
    setSelectedChapter(ch);
    if (selectedBook) {
      pause();
      loadAudio(selectedBook.id, ch.id);
    }
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Audio Biblia</Text>
      </View>

      {!selectedBook ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Selecciona un libro</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {books.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => handleSelectBook(book)}
                style={{ backgroundColor: colors.surfaceLowest, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{book.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : !selectedChapter ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Pressable onPress={() => setSelectedBook(null)} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary }}>{'< Volver a libros'}</Text>
          </Pressable>
          <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{selectedBook.name} - Selecciona capitulo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {chapters.map((ch) => (
              <Pressable
                key={ch.id}
                onPress={() => handleSelectChapter(ch)}
                style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurface }}>{ch.number}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface, textAlign: 'center' }}>{selectedBook.name}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Capitulo {selectedChapter.number}</Text>

            {audioLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
            ) : error ? (
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center' }}>{error}</Text>
                <Pressable
                  onPress={() => loadAudio(selectedBook!.id, selectedChapter!.id)}
                  style={{ marginTop: 12, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Reintentar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ width: '100%', marginTop: 32 }}>
                <View style={{ height: 6, backgroundColor: colors.surfaceHigh, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <View style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 3 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{formatTime(position)}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{formatTime(duration)}</Text>
                </View>
                <Pressable
                  onPress={togglePlayPause}
                  style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
                >
                  {isPlaying ? <Pause size={32} color={colors.onPrimary} /> : <Play size={32} color={colors.onPrimary} />}
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => { setSelectedChapter(null); pause(); }}
              style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceLow }}
            >
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{'< Cambiar capitulo'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
