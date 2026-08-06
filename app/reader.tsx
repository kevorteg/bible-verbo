import { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, BackHandler, Modal, TouchableOpacity, AppState, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Lightbulb, Headphones, Bookmark, Star, Zap, Settings, BrainCircuit } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../contexts/ThemeContext';
import { useBibleReader, setPendingNavigation } from '../hooks/useBibleReader';
import { useGamification } from '../hooks/useGamification';
import { Toast } from '../components/Toast';
import { playCompletionSound, playAchievementSound } from '../services/audioUtils';
import { addFavorite, removeFavorite, isFavorite } from '../services/favoritesService';
import { AchievementDef } from '../services/gamificationEngine';
import { loadReaderSettings, saveReaderSettings, BG_COLORS, ReaderSettings, ReaderBg, ReaderFont } from '../services/readerSettings';
import { getActiveGoals, contributeToGoal, addContribution } from '../services/collectiveGoals';
import { logGroupReading } from '../services/groupService';
import { contributeToActiveChallenges } from '../services/challengeService';
import { useAuth } from '../contexts/AuthContext';

const green = '#2E7D32';

const tips = [
  'Recuerda orar antes de leer, pide a Dios que te hable a traves de Su Palabra',
  'Lee en voz alta para escuchar la Palabra con tus oidos',
  'Preguntate: Que me dice este pasaje sobre Dios?',
  'Anota en tu cuaderno lo que Dios te revela mientras lees',
  'Comparte lo que aprendiste con alguien hoy',
  'Imagina que eres parte de la historia que lees',
  'Busca una promesa de Dios en este capitulo',
  'Preguntate: Como puedo aplicar esto hoy?',
];

const COMPREHENSION_QUESTIONS = [
  { q: 'Quien escribio la mayor parte del Nuevo Testamento?', opts: ['Pedro', 'Pablo', 'Juan'], correct: 1 },
  { q: 'Cuantos libros tiene la Biblia?', opts: ['27', '39', '66'], correct: 2 },
  { q: 'Cual es el primer libro de la Biblia?', opts: ['Exodo', 'Genesis', 'Salmos'], correct: 1 },
  { q: 'Quien construyo el arca?', opts: ['Abraham', 'Noe', 'Moisés'], correct: 1 },
  { q: 'Cuantos discipulos tenia Jesus?', opts: ['7', '10', '12'], correct: 2 },
  { q: 'En que ciudad nacio Jesus?', opts: ['Nazaret', 'Belen', 'Jerusalen'], correct: 1 },
  { q: 'Quien fue el primer rey de Israel?', opts: ['David', 'Saul', 'Salomon'], correct: 1 },
  { q: 'Cuantos dias duro el diluvio?', opts: ['30', '40', '120'], correct: 1 },
  { q: 'Quien recibio los 10 mandamientos?', opts: ['Josue', 'Moisés', 'Aaron'], correct: 1 },
  { q: 'Cual es el libro mas largo de la Biblia?', opts: ['Salmos', 'Isaias', 'Jeremias'], correct: 0 },
];

const MIN_SECONDS_PER_VERSE = 5;
const REQUIRED_SCROLL_PCT = 0.6;

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string; chapter: string; bookId: string; chapterId: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const confettiRef = useRef<ConfettiCannon>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    bg: 'cream', fontSize: 16, lineHeight: 1.6, font: 'PlusJakartaSans', verseSpacing: 12,
  });

  const {
    data: gamData, awardChapter, awardBook,
  } = useGamification();

  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'achievement' | 'streak' | 'levelup' | 'info' | 'warning';
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });

  const [achQueue, setAchQueue] = useState<AchievementDef[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [pendingLevelUps, setPendingLevelUps] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showComprehension, setShowComprehension] = useState(false);
  const [compQuestion, setCompQuestion] = useState<{ q: string; opts: string[]; correct: number } | null>(null);
  const [compResult, setCompResult] = useState<'pending' | 'correct' | 'wrong'>('pending');

  const entryTimeRef = useRef(Date.now());
  const appStateRef = useRef(AppState.currentState);
  const backgroundTotalRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasScrolledRef = useRef(false);
  const lastVerseVisibleRef = useRef(0);
  const tipAnim = useRef(new Animated.Value(1)).current;

  const showToast = (type: typeof toast.type, title: string, message: string) => {
    setToast({ visible: true, type, title, message });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
    if (achQueue.length > 0) {
      const [next, ...rest] = achQueue;
      setAchQueue(rest);
      showToast('achievement', 'Logro desbloqueado!', `${next.title}: ${next.description}`);
      playAchievementSound();
    } else if (showLevelUp) {
      setShowLevelUp(false);
      if (pendingLevelUps > 0) {
        setPendingLevelUps(prev => prev - 1);
        showToast('levelup', 'Subiste de nivel!', `Nuevo nivel: ${gamData.level}`);
        confettiRef.current?.start();
      }
    }
  };

  useEffect(() => {
    const loadFavs = async () => {
      const { getFavorites } = await import('../services/favoritesService');
      const list = await getFavorites();
      setFavs(new Set(list.map(f => f.id)));
    };
    loadFavs();
    loadReaderSettings().then(setReaderSettings);
  }, []);

  useEffect(() => {
    reloadProgress();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (params.bookId && params.chapter) {
        setPendingNavigation(params.bookId, parseInt(params.chapter));
      }
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      entryTimeRef.current = Date.now();
      hasScrolledRef.current = false;
      lastVerseVisibleRef.current = 0;
      backgroundTotalRef.current = 0;
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        Alert.alert('Salir del lector?', 'Tu progreso se ha guardado automaticamente.', [
          { text: 'Quedarme', style: 'cancel' },
          { text: 'Salir', onPress: () => router.canGoBack() ? router.back() : router.push('/(tabs)') },
        ]);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        backgroundTotalRef.current += Date.now() - entryTimeRef.current;
      } else if (nextState === 'active') {
        entryTimeRef.current = Date.now();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(tipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentTipIndex(prev => (prev + 1) % tips.length);
        Animated.timing(tipAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tipAnim]);

  const {
    verses, loading, currentBook, currentChapter,
    chaptersList, readChapters, reloadProgress,
    handleNextChapter, handlePrevChapter, handleToggleReadChapter,
  } = useBibleReader();

  const isRead = currentBook ? (readChapters[currentBook.id] || []).includes(currentChapter?.number || '') : false;
  const readCount = currentBook ? (readChapters[currentBook.id]?.length || 0) : 0;

  const getElapsedSeconds = () => {
    const total = backgroundTotalRef.current + (Date.now() - entryTimeRef.current);
    return Math.floor(total / 1000);
  };

  const getMinRequiredSeconds = () => {
    return Math.max(30, (verses.length || 1) * MIN_SECONDS_PER_VERSE);
  };

  const getScrollPct = () => {
    if (!verses.length) return 0;
    return Math.min(lastVerseVisibleRef.current / verses.length, 1);
  };

  const getRandomQuestion = () => {
    return COMPREHENSION_QUESTIONS[Math.floor(Math.random() * COMPREHENSION_QUESTIONS.length)];
  };

  const handleMarkRead = async () => {
    if (!currentBook || !currentChapter) return;
    const wasRead = isRead;
    handleToggleReadChapter(currentBook.id, currentChapter.number);

    if (wasRead) return;

    const elapsed = getElapsedSeconds();
    const minRequired = getMinRequiredSeconds();
    const scrollPct = getScrollPct();

    if (elapsed < minRequired || scrollPct < REQUIRED_SCROLL_PCT) {
      showToast('warning', 'Lectura express detectada', `Debes leer al menos ${minRequired}s para ganar XP. Llevas ${elapsed}s.`);
      playCompletionSound();
      showToast('success', 'Capitulo marcado', `${currentBook.name} ${currentChapter.number} marcado como leido`);
      return;
    }

    playCompletionSound();

    const question = getRandomQuestion();
    setCompQuestion(question);
    setCompResult('pending');
    setShowComprehension(true);
  };

  const handleComprehensionAnswer = async (selected: number) => {
    if (!compQuestion || compResult !== 'pending') return;

    if (selected === compQuestion.correct) {
      setCompResult('correct');

      const today = new Date().toISOString().split('T')[0];
      const isFirstToday = gamData.lastActivityDate !== today;

      const { newAchievements, levelUp } = await awardChapter(isFirstToday);

      const activeGoals = await getActiveGoals();
      for (const goal of activeGoals) {
        const result = await contributeToGoal(goal.id, 1);
        await addContribution(goal.id, 1);
        if (result.newMilestones.length > 0) {
          for (const m of result.newMilestones) {
            showToast('achievement', 'Hito de meta!', `${goal.title}: ${m.label} (+${m.rewardCoins} monedas)`);
          }
        }
        if (result.goalCompleted) {
          showToast('success', 'Meta completada!', `${goal.title} ha sido completada!`);
        }
      }

      const xpGain = levelUp > 0 ? 'Subiste de nivel!' : `+XP por leer ${currentBook.name} ${currentChapter.number}`;
      showToast('success', 'Capitulo completado!', xpGain);

      if (currentBook && currentChapter) {
        await logGroupReading(user?.name || 'Tu', `${currentBook.name} ${currentChapter.number}`);
      }
      await contributeToActiveChallenges();

      if (levelUp > 0) {
        setPendingLevelUps(levelUp);
        setShowLevelUp(true);
        setTimeout(() => confettiRef.current?.start(), 300);
      }

      if (newAchievements.length > 0) {
        setAchQueue(newAchievements);
      }

      const newCount = readCount + 1;
      if (newCount === chaptersList.length) {
        setTimeout(async () => {
          const bookResult = await awardBook(isFirstToday);
          showToast('success', 'Libro completado!', `+${500 * (gamData.streakDays >= 7 ? 1.5 : 1)} XP por completar ${currentBook.name}`);
          confettiRef.current?.start();
          if (bookResult.newAchievements.length > 0) {
            setAchQueue(prev => [...prev, ...bookResult.newAchievements]);
          }
        }, 1200);
      }

      setTimeout(() => {
        setShowComprehension(false);
        setCompQuestion(null);
      }, 2000);
    } else {
      setCompResult('wrong');
      showToast('info', 'Respuesta incorrecta', 'Sigue leyendo! No se otorga XP por esta lectura.');
      setTimeout(() => {
        setShowComprehension(false);
        setCompQuestion(null);
      }, 2500);
    }
  };

  const handleSkipComprehension = () => {
    showToast('info', 'Sin verificación', 'Puedes responder la pregunta en tu siguiente lectura.');
    setShowComprehension(false);
    setCompQuestion(null);
  };

  const handleToggleFav = async (verse: { id: string; number: string; text: string }) => {
    const verseId = `${currentBook?.id}-${currentChapter?.number}-${verse.number}`;
    if (favs.has(verseId)) {
      await removeFavorite(verseId);
      setFavs(prev => { const n = new Set(prev); n.delete(verseId); return n; });
    } else {
      await addFavorite({
        id: verseId,
        bookName: currentBook?.name || '',
        chapterNum: currentChapter?.number || '',
        verseNum: verse.number,
        text: verse.text.substring(0, 100),
        createdAt: new Date().toISOString(),
      });
      setFavs(prev => { const n = new Set(prev); n.add(verseId); return n; });
    }
  };

  const handleScroll = (e: any) => {
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    if (!hasScrolledRef.current && offsetY > 0) {
      hasScrolledRef.current = true;
    }
    const scrollFraction = (offsetY + layoutHeight) / contentHeight;
    const verseIdx = Math.min(Math.floor(scrollFraction * verses.length), verses.length);
    if (verseIdx > lastVerseVisibleRef.current) {
      lastVerseVisibleRef.current = verseIdx;
    }
  };

  const goBack = () => {
    Alert.alert('Salir del lector?', 'Tu progreso se ha guardado.', [
      { text: 'Quedarme', style: 'cancel' },
      { text: 'Salir', onPress: () => router.canGoBack() ? router.back() : router.push('/(tabs)') },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: 200, y: -20 }}
        autoStart={false}
        fadeOut
        colors={['#449BD1', '#2E7D32', '#F58634', '#FFFFFF']}
      />

      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onDismiss={closeToast}
        duration={3000}
      />

      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={goBack} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{currentBook?.name || params.book || '...'}</Text>
          <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' }}>Capitulo {currentChapter?.number || params.chapter || '1'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
          >
            <Settings size={22} color={colors.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => currentBook && currentChapter && router.push({ pathname: '/audio-bible', params: { book: currentBook.id, chapter: currentChapter.id } })}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
          >
            <Headphones size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surfaceLowest, borderRadius: 12, padding: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' }}>Progreso del libro</Text>
          <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary }}>{readCount}/{chaptersList.length} capitulos</Text>
        </View>
        <View style={{ height: 8, backgroundColor: colors.surfaceHigh, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${chaptersList.length > 0 ? (readCount / chaptersList.length) * 100 : 0}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Zap size={14} color={colors.tertiary} />
          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
            Nivel {gamData.level} | {gamData.xp} XP | {gamData.streakDays} dias racha
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: BG_COLORS[readerSettings.bg].bg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          <View style={{ marginBottom: 20, backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 16, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Lightbulb size={20} color={colors.primary} />
              <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' }}>Consejo</Text>
            </View>
            <Animated.View style={{ opacity: tipAnim }}>
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans', color: colors.onPrimaryContainer, lineHeight: 22 }}>
                {tips[currentTipIndex]}
              </Text>
            </Animated.View>
          </View>

          {verses.length === 0 ? (
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 }}>
              Cargando versiculos...
            </Text>
          ) : (
            verses.map((verse, idx) => (
              <Pressable
                key={verse.id}
                style={({ pressed }) => ({
                  backgroundColor: BG_COLORS[readerSettings.bg].surface,
                  borderRadius: 12, padding: 16, marginBottom: readerSettings.verseSpacing,
                  shadowColor: 'rgba(0,0,0,0.08)',
                  shadowOffset: { width: 0, height: pressed ? 2 : 6 },
                  shadowOpacity: 1, shadowRadius: 0,
                  elevation: pressed ? 2 : 6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Pressable onPress={() => handleToggleFav(verse)} style={{ marginTop: 2 }}>
                    <Bookmark size={16} color={favs.has(`${currentBook?.id}-${currentChapter?.number}-${verse.number}`) ? colors.tertiary : colors.onSurfaceVariant} fill={favs.has(`${currentBook?.id}-${currentChapter?.number}-${verse.number}`) ? colors.tertiary : 'transparent'} />
                  </Pressable>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary }}>{verse.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: readerSettings.fontSize, fontFamily: readerSettings.font, color: BG_COLORS[readerSettings.bg].text, lineHeight: readerSettings.fontSize * readerSettings.lineHeight }}>
                      {verse.text}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}

          <Pressable
            onPress={handleMarkRead}
            style={{
              backgroundColor: isRead ? green : colors.primary,
              borderRadius: 16, padding: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
              shadowColor: isRead ? 'rgba(46,125,50,0.4)' : colors.primaryShadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 1, shadowRadius: 0, elevation: 8,
            }}
          >
            <CheckCircle2 size={22} color={isRead ? '#FFFFFF' : colors.onPrimary} />
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: isRead ? '#FFFFFF' : colors.onPrimary }}>
              {isRead ? 'Completado' : 'Marcar como leido'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={{ position: 'absolute', bottom: 32, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={handlePrevChapter} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </Pressable>
        <Pressable onPress={handleNextChapter} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
          <ChevronRight size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <Modal visible={showComprehension} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 }}>
            {compResult === 'correct' ? (
              <>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: green + '20', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 }}>
                  <CheckCircle2 size={28} color={green} />
                </View>
                <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: green, textAlign: 'center', marginBottom: 4 }}>Correcto!</Text>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center' }}>Has demostrado que leiste con atencion. XP otorgado!</Text>
              </>
            ) : compResult === 'wrong' ? (
              <>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E53935' + '20', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 }}>
                  <BrainCircuit size={28} color={'#E53935'} />
                </View>
                <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: '#E53935', textAlign: 'center', marginBottom: 4 }}>Incorrecto</Text>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center' }}>La respuesta correcta era: {compQuestion?.opts[compQuestion?.correct || 0]}</Text>
              </>
            ) : (
              <>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 }}>
                  <BrainCircuit size={28} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface, textAlign: 'center', marginBottom: 16 }}>
                  {compQuestion?.q}
                </Text>
                {compQuestion?.opts.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleComprehensionAnswer(i)}
                    style={{ backgroundColor: colors.surfaceLow, borderRadius: 14, padding: 14, marginBottom: 8, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={handleSkipComprehension} style={{ marginTop: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Saltar verificación</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Personalizar lectura</Text>
              <Pressable onPress={() => setShowSettings(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Fondo</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              {(Object.entries(BG_COLORS) as [ReaderBg, typeof BG_COLORS[ReaderBg]][]).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setReaderSettings(prev => ({ ...prev, bg: key }))}
                  style={{ flex: 1, alignItems: 'center', gap: 6 }}
                >
                  <View style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: val.bg, borderWidth: readerSettings.bg === key ? 2 : 0, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                    {readerSettings.bg === key && <CheckCircle2 size={20} color={colors.primary} />}
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Tamano de letra</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>A</Text>
              <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                {[14, 16, 18, 20, 22, 24, 26].map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setReaderSettings(prev => ({ ...prev, fontSize: size }))}
                    style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: readerSettings.fontSize === size ? colors.primary : colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: readerSettings.fontSize === size ? colors.onPrimary : colors.onSurface }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 20, color: colors.onSurfaceVariant }}>A</Text>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Espaciado</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {[
                { value: 1.4, label: 'Compacto' },
                { value: 1.6, label: 'Normal' },
                { value: 1.8, label: 'Amplio' },
                { value: 2.0, label: 'Espaciado' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setReaderSettings(prev => ({ ...prev, lineHeight: opt.value }))}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: readerSettings.lineHeight === opt.value ? colors.primary : colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: readerSettings.lineHeight === opt.value ? colors.onPrimary : colors.onSurface }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Tipografia</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {([
                { value: 'PlusJakartaSans', label: 'Sans' },
                { value: 'BricolageGrotesque', label: 'Display' },
                { value: 'SpaceGrotesk', label: 'Mono' },
                { value: 'serif', label: 'Serif' },
                { value: 'mono', label: 'Mono2' },
              ] as { value: ReaderFont; label: string }[]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setReaderSettings(prev => ({ ...prev, font: opt.value }))}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: readerSettings.font === opt.value ? colors.primary : colors.surfaceLow, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: readerSettings.font === opt.value ? colors.onPrimary : colors.onSurface }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Pressable
              onPress={async () => { await saveReaderSettings(readerSettings); setShowSettings(false); }}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
