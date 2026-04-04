import { useState } from 'react';
import { QuizQuestion, Book, Chapter, Verse } from '../types';
import { generateChapterQuiz, TriviaRecommendation, generateTriviaRecommendations, TriviaResult } from '../services/aiFeatures';
import { useAchievements } from './useAchievements';
import { Achievement } from '../types';

export const useQuiz = (
    currentBook: Book | null,
    currentChapter: Chapter | null,
    verses: Verse[],
    showToast: (msg: string) => void
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

    const [recommendations, setRecommendations] = useState<TriviaRecommendation[]>([]);
    const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

    const { saveAchievement } = useAchievements();

    const startQuiz = async () => {
        if (!currentBook || !currentChapter || verses.length === 0) return;
        setQuizState('loading');
        const fullText = verses.map(v => v.text).join(" ");
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
                showToast("La IA no devolvió preguntas.");
            }
        } catch (e: any) {
            setQuizState('idle');
            showToast(`Error: ${e.message}`);
        }
    };

    const answerQuiz = (optionIdx: number) => {
        if (showFeedback) return; // Prevent double clicks

        setSelectedOption(optionIdx);
        setShowFeedback(true);

        // Save user answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQuizIndex] = optionIdx;
        setUserAnswers(newAnswers);

        const isCorrect = optionIdx === quizData[currentQuizIndex].correctIndex;
        if (isCorrect) {
            setQuizScore(s => s + 1);
            showToast("¡Correcto!");
        } else {
            showToast("Incorrecto.");
        }
    };

    const nextQuestion = () => {
        setShowFeedback(false);
        setSelectedOption(null);

        if (currentQuizIndex < quizData.length - 1) {
            setCurrentQuizIndex(prev => prev + 1);
        } else {
            setQuizState('finished');
            
            if (currentBook && currentChapter) {
                setIsGeneratingRecommendations(true);
                generateTriviaRecommendations(
                    currentBook.name,
                    currentChapter.number,
                    quizScore,
                    quizData.length,
                    topic
                ).then((recs: TriviaResult) => {
                    setRecommendations(recs.recommendations || []);
                    if (recs.achievement) {
                        // The user answered a question, quizScore is updated synchronously.
                        // However, answerQuiz set it eagerly. Is it the latest? Yes.
                        const finalScore = quizScore;
                        const newAcc: Achievement = {
                            id: `${currentBook.name}-${currentChapter.number}-${Date.now()}`,
                            title: recs.achievement.title,
                            description: recs.achievement.description,
                            icon: recs.achievement.icon || '🏆',
                            dateUnlocked: new Date().toISOString(),
                            type: finalScore === quizData.length ? 'expert' : (finalScore >= quizData.length * 0.8 ? 'honor' : 'troll')
                        };
                        setUnlockedAchievement(newAcc);
                        saveAchievement(newAcc);
                    }
                    setIsGeneratingRecommendations(false);
                }).catch(() => setIsGeneratingRecommendations(false));
            }
        }
    };

    const resetQuiz = () => {
        setQuizState('idle');
        setQuizScore(0);
        setCurrentQuizIndex(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setUserAnswers([]);
        setRecommendations([]);
        setIsGeneratingRecommendations(false);
        setUnlockedAchievement(null);
    };

    return {
        quizData, setQuizData,
        quizState, setQuizState,
        currentQuizIndex, setCurrentQuizIndex,
        quizScore, setQuizScore,
        startQuiz,
        answerQuiz,
        resetQuiz,
        selectedOption,
        showFeedback,
        nextQuestion,
        userAnswers,
        difficulty, setDifficulty,
        topic, setTopic,
        recommendations, isGeneratingRecommendations,
        unlockedAchievement
    };
};
