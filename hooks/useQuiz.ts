import { useState } from 'react';
import { QuizQuestion, Book, Chapter, Verse, Achievement } from '../types';
import { generateChapterQuiz } from '../services/aiFeatures';

export const useQuiz = (
  currentBook: Book | null,
  currentChapter: Chapter | null,
  verses: Verse[]
) => {
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<'idle' | 'loading' | 'active' | 'finished'>('idle');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [topic, setTopic] = useState<'general' | 'historia' | 'teologia' | 'aplicacion'>('general');

  const startQuiz = async () => {
    if (!currentBook || !currentChapter || verses.length === 0) return;
    setQuizState('loading');
    const fullText = verses.map(v => v.text).join(' ');
    try {
      const questions = await generateChapterQuiz(fullText, currentBook.name, currentChapter.number, difficulty, topic);
      if (questions.length > 0) {
        setQuizData(questions);
        setQuizState('active');
        setCurrentQuizIndex(0);
        setQuizScore(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setUserAnswers(new Array(questions.length).fill(null));
      } else {
        setQuizState('idle');
      }
    } catch {
      setQuizState('idle');
    }
  };

  const answerQuiz = (optionIdx: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIdx);
    setShowFeedback(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuizIndex] = optionIdx;
    setUserAnswers(newAnswers);

    if (optionIdx === quizData[currentQuizIndex].correctIndex) {
      setQuizScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelectedOption(null);

    if (currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizState('finished');
    }
  };

  const resetQuiz = () => {
    setQuizState('idle');
    setQuizScore(0);
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setUserAnswers([]);
  };

  return {
    quizData,
    quizState,
    currentQuizIndex,
    quizScore,
    startQuiz,
    answerQuiz,
    resetQuiz,
    selectedOption,
    showFeedback,
    nextQuestion,
    userAnswers,
    difficulty, setDifficulty,
    topic, setTopic,
  };
};
