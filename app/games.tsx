import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, BrainCircuit, Star, RefreshCw, Plus, BookOpen } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { saveTriviaScore } from '../services/triviaService';

const SEED_QUIZZES: { title: string; questions: QuizQuestion[] }[] = [
  {
    title: 'Principios Basicos',
    questions: [
      { question: 'Cuantos libros tiene la Biblia?', options: ['A) 27', 'B) 39', 'C) 66', 'D) 73'], correctIndex: 2, explanation: 'La Biblia tiene 66 libros.' },
      { question: 'Quien construyo el arca?', options: ['A) Moises', 'B) Noe', 'C) Abraham', 'D) David'], correctIndex: 1, explanation: 'Dios le ordeno a Noe.' },
      { question: 'Cual es el primer libro de la Biblia?', options: ['A) Salmos', 'B) Exodo', 'C) Genesis', 'D) Mateo'], correctIndex: 2, explanation: 'Genesis es el primer libro.' },
    ],
  },
  {
    title: 'Los Evangelios',
    questions: [
      { question: 'Cuantos evangelios hay en el NT?', options: ['A) 3', 'B) 4', 'C) 5', 'D) 2'], correctIndex: 1, explanation: 'Mateo, Marcos, Lucas y Juan.' },
      { question: 'Quien bautizo a Jesus?', options: ['A) Pedro', 'B) Juan el Bautista', 'C) Pablo', 'D) Eliseo'], correctIndex: 1, explanation: 'Juan el Bautista bautizo a Jesus.' },
      { question: 'Cuantos discipulos tenia Jesus?', options: ['A) 7', 'B) 10', 'C) 12', 'D) 14'], correctIndex: 2, explanation: 'Jesus tuvo 12 discipulos.' },
    ],
  },
  {
    title: 'Personajes del AT',
    questions: [
      { question: 'Quien partio el Mar Rojo?', options: ['A) Josue', 'B) Moises', 'C) Aaron', 'D) Elias'], correctIndex: 1, explanation: 'Dios uso a Moises para partir el mar.' },
      { question: 'Quien derroto a Goliat?', options: ['A) Saul', 'B) David', 'C) Samson', 'D) Josue'], correctIndex: 1, explanation: 'David derroto a Goliat con una honda.' },
      { question: 'A quien trago un gran pez?', options: ['A) Elias', 'B) Jonas', 'C) Daniel', 'D) Job'], correctIndex: 1, explanation: 'Jonas fue tragado por un gran pez.' },
    ],
  },
  {
    title: 'Los Profetas',
    questions: [
      { question: 'Quien fue llevado al cielo en un carro de fuego?', options: ['A) Eliseo', 'B) Elias', 'C) Isaías', 'D) Jeremias'], correctIndex: 1, explanation: 'Elias fue llevado al cielo en un carro de fuego (2 Reyes 2:11).' },
      { question: 'Cual profeta predico en Nineve?', options: ['A) Oseas', 'B) Joel', 'C) Jonas', 'D) Amos'], correctIndex: 2, explanation: 'Dios envio a Jonas a predicar a Nineve.' },
      { question: 'Quien vio un huesped de fuego?', options: ['A) Daniel', 'B) Ezequiel', 'C) Isaías', 'D) Jeremias'], correctIndex: 1, explanation: 'Ezequiel tuvo la vision del carro de fuego.' },
    ],
  },
  {
    title: 'Milagros de Jesus',
    questions: [
      { question: 'Cuantos panes y peces uso Jesus para alimentar a 5000?', options: ['A) 5 panes y 2 peces', 'B) 7 panes y 3 peces', 'C) 3 panes y 5 peces', 'D) 2 panes y 2 peces'], correctIndex: 0, explanation: 'Jesus multiplico 5 panes y 2 peces.' },
      { question: 'A quien resucito Jesus en Betania?', options: ['A) La hija de Jairo', 'B) Lazaro', 'C) El hijo de la viuda', 'D) Dorcas'], correctIndex: 1, explanation: 'Jesus resucito a Lazaro en Betania (Juan 11).' },
      { question: 'En que lago caminó Jesus sobre el agua?', options: ['A) Mar Muerto', 'B) Mar de Galilea', 'C) Rio Jordan', 'D) Mar Rojo'], correctIndex: 1, explanation: 'Jesus camino sobre el Mar de Galilea.' },
    ],
  },
  {
    title: 'Cartas de Pablo',
    questions: [
      { question: 'A quien escribio Pablo las cartas pastorales?', options: ['A) Pedro y Juan', 'B) Timoteo y Tito', 'C) Lucas y Marcos', 'D) Silas y Bernabe'], correctIndex: 1, explanation: 'Pablo escribio a Timoteo y Tito.' },
      { question: 'Cual es la carta mas larga de Pablo?', options: ['A) Romanos', 'B) 1 Corintios', 'C) Efesios', 'D) Hebreos'], correctIndex: 0, explanation: 'Romanos es la carta mas larga de Pablo.' },
      { question: 'Que ciudad tenia un altar al Dios no conocido?', options: ['A) Corinto', 'B) Efeso', 'C) Atenas', 'D) Filipos'], correctIndex: 2, explanation: 'Pablo predico en Atenas sobre el altar al Dios no conocido (Hechos 17:23).' },
    ],
  },
  {
    title: 'Salmos y Sabiduria',
    questions: [
      { question: 'Cual es el Salmo mas conocido?', options: ['A) Salmo 1', 'B) Salmo 23', 'C) Salmo 51', 'D) Salmo 119'], correctIndex: 1, explanation: 'El Salmo 23 es el mas conocido: Jehova es mi pastor.' },
      { question: 'Quien escribio la mayoria de los Proverbios?', options: ['A) David', 'B) Salomon', 'C) Moises', 'D) Job'], correctIndex: 1, explanation: 'Salomon escribio la mayoria de los Proverbios.' },
      { question: 'Que libro pregunta: De donde viene la sabiduria?', options: ['A) Eclesiastes', 'B) Job', 'C) Proverbios', 'D) Salmos'], correctIndex: 1, explanation: 'Job 28 pregunta de donde viene la sabiduria.' },
    ],
  },
  {
    title: 'Apocalipsis y Profecia',
    questions: [
      { question: 'Cuantos sellos abre el Cordero en Apocalipsis?', options: ['A) 4', 'B) 6', 'C) 7', 'D) 10'], correctIndex: 2, explanation: 'El Cordero abre 7 sellos (Apocalipsis 6).' },
      { question: 'Cual es el nombre del ultimo libro de la Biblia?', options: ['A) Profecia', 'B) Apocalipsis', 'C) Revelacion', 'D) Daniel'], correctIndex: 1, explanation: 'Apocalipsis es el ultimo libro de la Biblia.' },
      { question: 'Cuantos anos durara el reinado de Cristo segun Apocalipsis?', options: ['A) 100', 'B) 1000', 'C) 500', 'D) 7000'], correctIndex: 1, explanation: 'Apocalipsis 20 habla del reinado milenial de 1000 anos.' },
    ],
  },
  {
    title: 'La Creacion y Patriarcas',
    questions: [
      { question: 'En cuantos dias creo Dios el mundo?', options: ['A) 5', 'B) 6', 'C) 7', 'D) 10'], correctIndex: 1, explanation: 'Dios creo el mundo en 6 dias y descanso el 7.' },
      { question: 'Quien fue el primer sacerdote segun el orden de Melquisedec?', options: ['A) Aaron', 'B) Cristo', 'C) Levi', 'D) Abraham'], correctIndex: 1, explanation: 'Cristo es sacerdote segun el orden de Melquisedec (Hebreos 7).' },
      { question: 'A que edad murio Moises?', options: ['A) 90', 'B) 100', 'C) 120', 'D) 150'], correctIndex: 2, explanation: 'Moises murio a los 120 anos (Deuteronomio 34:7).' },
    ],
  },
  {
    title: 'Fruto del Espiritu',
    questions: [
      { question: 'Cuantos frutos del Espiritu menciona Galatas 5?', options: ['A) 7', 'B) 8', 'C) 9', 'D) 10'], correctIndex: 2, explanation: 'Galatas 5:22-23 menciona 9 frutos del Espiritu.' },
      { question: 'Cual es el primer fruto del Espiritu mencionado?', options: ['A) Gozo', 'B) Amor', 'C) Paz', 'D) Paciencia'], correctIndex: 1, explanation: 'El amor es el primer fruto del Espiritu mencionado.' },
      { question: 'Que libro habla del amor de forma mas detallada?', options: ['A) Romanos', 'B) 1 Corintios 13', 'C) Efesios', 'D) 1 Juan'], correctIndex: 1, explanation: '1 Corintios 13 es el capitulo del amor.' },
    ],
  },
  {
    title: 'Historia de Israel',
    questions: [
      { question: 'Quien fue el primer rey de Israel?', options: ['A) David', 'B) Saul', 'C) Salomon', 'D) Samuel'], correctIndex: 1, explanation: 'Saul fue el primer rey de Israel.' },
      { question: 'Cuantos anos estuvieron los israelitas en el desierto?', options: ['A) 20', 'B) 30', 'C) 40', 'D) 50'], correctIndex: 2, explanation: 'Israel vagó 40 años en el desierto.' },
      { question: 'Cual era el nombre original de Abraham?', options: ['A) Abram', 'B) Abner', 'C) Adonias', 'D) Aaron'], correctIndex: 0, explanation: 'Dios le cambió el nombre de Abram a Abraham.' },
    ],
  },
];

export default function GamesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!quiz) return;
      const onBackPress = () => {
        Alert.alert('Salir de la trivia?','Perderas tu progreso.',[
          {text:'Seguir jugando',style:'cancel'},
          {text:'Salir',onPress:()=>{setQuiz(null);setCurrentQ(0);setScore(0);setSelected(null);setGameOver(false);}}
        ]);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [quiz])
  );

  const startQuiz = async (seed?: { title: string; questions: QuizQuestion[] }) => {
    if (seed) {
      setQuiz(seed.questions);
      setQuizTitle(seed.title);
      setCurrentQ(0);
      setScore(0);
      setSelected(null);
      setGameOver(false);
      return;
    }
    setLoading(true);
    setQuizTitle('Generada por IA');
    try {
      const questions = await generateQuiz('facil', 'general');
      setQuiz(questions);
      setCurrentQ(0);
      setScore(0);
      setSelected(null);
      setGameOver(false);
    } catch {
      const fallback = SEED_QUIZZES[0].questions;
      setQuiz(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    if (quiz && index === quiz[currentQ].correctIndex) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (quiz && currentQ < quiz.length - 1) {
        setCurrentQ(q => q + 1);
        setSelected(null);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const saveScore = async () => {
    await saveTriviaScore(quizTitle, score, quiz?.length || 0);
  };

  if (gameOver) {
    saveScore();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Juegos / Trivia</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {!quiz ? (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <BrainCircuit size={80} color={colors.primary} />
              <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 16 }}>Trivia Biblica</Text>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>Pon a prueba tu conocimiento</Text>
              <Pressable
                onPress={() => startQuiz()}
                disabled={loading}
                style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
              >
                {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Generar Trivia IA</Text>}
              </Pressable>
            </View>

            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Trivias Disponibles</Text>
            {SEED_QUIZZES.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => startQuiz(s)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{s.title}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{s.questions.length} preguntas</Text>
              </Pressable>
            ))}

            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' }}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary }}>Crear Trivia</Text>
            </Pressable>
          </View>
        ) : gameOver ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Star size={80} color={colors.primary} />
            <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 16 }}>Juego Terminado!</Text>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 4 }}>{quizTitle}</Text>
            <Text style={{ fontSize: 48, fontFamily: 'BricolageGrotesque', color: colors.primary, marginTop: 12 }}>{score}/{quiz.length}</Text>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>preguntas correctas</Text>
            <Pressable
              onPress={() => { setQuiz(null); setGameOver(false); }}
              style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
            >
              <RefreshCw size={20} color={colors.onPrimary} />
              <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Volver</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 4 }}>{quizTitle}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 8 }}>Pregunta {currentQ + 1} de {quiz.length}</Text>
            <View style={{ height: 8, backgroundColor: colors.surfaceHigh, borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
              <View style={{ width: `${((currentQ + 1) / quiz.length) * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
            </View>

            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, marginBottom: 24, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginBottom: 20 }}>{quiz[currentQ].question}</Text>
              {quiz[currentQ].options.map((opt, idx) => {
                const isCorrect = idx === quiz[currentQ].correctIndex;
                const isSelected = selected === idx;
                let bg = colors.surfaceLow;
                if (selected !== null) {
                  bg = isCorrect ? colors.primary + '25' : isSelected ? colors.tertiary + '25' : colors.surfaceLow;
                }
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleAnswer(idx)}
                    style={{ backgroundColor: bg, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: selected !== null && isCorrect ? '#2E7D32' : isSelected ? colors.tertiary : colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: selected !== null && isCorrect ? '#FFFFFF' : isSelected ? '#FFFFFF' : colors.onSurfaceVariant }}>{String.fromCharCode(65 + idx)}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, flex: 1 }}>{opt}</Text>
                  </Pressable>
                );
              })}
              {selected !== null && (
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 8, fontStyle: 'italic' }}>{quiz[currentQ].explanation}</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
