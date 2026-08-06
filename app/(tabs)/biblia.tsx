import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { BookOpen, Sprout, Waves, ChevronDown, ChevronLeft, LogIn } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBibleReader, setPendingNavigation } from '../../hooks/useBibleReader';
import { BIBLE_VERSIONS } from '../../constants';

const green = '#2E7D32';
const greenContainer = '#E8F5E9';

const bookIconMap: Record<string, { icon: any; color: string }> = {
  'Gen': { icon: Sprout, color: green },
  'Exo': { icon: Waves, color: green },
};

function getIcon(bookId: string, primary: string) {
  const key = bookId.split('.').pop()?.substring(0, 3) || '';
  return bookIconMap[key] || { icon: BookOpen, color: primary };
}

export default function BibliaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    bibleId, setBibleId, apiBooks, currentBook, setCurrentBook,
    chaptersList, currentChapter, loading, readChapters, reloadProgress,
  } = useBibleReader();
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reloadProgress();
    }, [])
  );

  const totalRead = currentBook ? (readChapters[currentBook.id]?.length || 0) : 0;
  const currentVersion = BIBLE_VERSIONS.find(v => v.id === bibleId) || BIBLE_VERSIONS[0];
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || null;

  const handleSelectBook = (book: typeof apiBooks[0]) => {
    setCurrentBook(book);
    setShowChapters(true);
  };

  if (showChapters && currentBook) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setShowChapters(false)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <ChevronLeft size={22} color={colors.onSurface} />
          </Pressable>
          <View>
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{currentBook.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: green }}>{totalRead}/{chaptersList.length} capitulos</Text>
              <View style={{ width: 60, height: 6, backgroundColor: colors.surfaceHigh, borderRadius: 3, overflow: 'hidden', marginLeft: 4 }}>
                <View style={{ width: `${chaptersList.length > 0 ? (totalRead / chaptersList.length) * 100 : 0}%`, height: '100%', backgroundColor: green, borderRadius: 3 }} />
              </View>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ width: '100%', marginTop: 40 }} />
          ) : (
            chaptersList.map((ch) => {
              const isCompleted = (readChapters[currentBook.id] || []).includes(ch.number);
              const isCurrent = currentChapter?.id === ch.id;
              return (
                <Pressable
                  key={ch.id}
                  onPress={() => {
                    setPendingNavigation(currentBook.id, parseInt(ch.number));
                    router.push({ pathname: '/reader', params: { book: currentBook.name, chapter: ch.number, bookId: currentBook.id } });
                  }}
                  style={{
                    width: 64, height: 80, borderRadius: 16,
                    backgroundColor: isCompleted ? green : isCurrent ? colors.primaryContainer : colors.surfaceLow,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: isCompleted ? 'rgba(46,125,50,0.4)' : 'rgba(0,0,0,0.08)',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
                  }}
                >
                  {isCompleted ? (
                    <Text style={{ fontSize: 24, color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' }}>✓</Text>
                  ) : (
                    <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: isCurrent ? colors.onPrimary : colors.onSurfaceVariant }}>{ch.number}</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookOpen size={28} color={colors.primary} />
            <Text style={{ fontSize: 28, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Verbo</Text>
            <Pressable onPress={() => setShowVersionPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceHigh, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 0.5 }}>{currentVersion.name.substring(0, 12)}</Text>
              <ChevronDown size={12} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          {user ? (
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.onPrimary, fontFamily: 'PlusJakartaSans_700Bold' }}>{userInitial}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/auth/login')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <LogIn size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <Modal visible={showVersionPicker} transparent animationType="fade" onRequestClose={() => setShowVersionPicker(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowVersionPicker(false)}>
            <Pressable onPress={() => {}} style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, width: '80%', maxWidth: 320, shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 0, elevation: 12 }}>
              <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginBottom: 16, textAlign: 'center' }}>Version de la Biblia</Text>
              {BIBLE_VERSIONS.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => { setBibleId(v.id); setShowVersionPicker(false); }}
                  style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: v.id === bibleId ? colors.primaryContainer : 'transparent', marginBottom: 4 }}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: v.id === bibleId ? colors.onPrimaryContainer : colors.onSurface }}>{v.name}</Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <View style={{ paddingHorizontal: 24, paddingBottom: 100 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            Selecciona un Libro
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {apiBooks.map((book) => {
                const { icon: Icon, color: iconColor } = getIcon(book.id, colors.primary);
                const readCount = readChapters[book.id]?.length || 0;
                return (
                  <Pressable
                    key={book.id}
                    onPress={() => handleSelectBook(book)}
                    style={{
                      width: '46%', borderRadius: 16, padding: 16,
                      backgroundColor: readCount > 0 ? colors.surfaceLowest : colors.surfaceLowest,
                      shadowColor: 'rgba(0,0,0,0.08)',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 1, shadowRadius: 0, elevation: 8,
                    }}
                  >
                    <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: readCount > 0 ? green + '22' : colors.surfaceLow, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      <Icon size={32} color={readCount > 0 ? green : iconColor} />
                    </View>
                    <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{book.name}</Text>
                    <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: readCount > 0 ? green : colors.onSurfaceVariant, marginTop: 4 }}>
                      {readCount > 0 ? `${readCount} capitulos leidos` : `0 leidos`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
