import { callGeminiDirect } from './geminiService';
import { QuizQuestion } from '../types';

export const generateChapterQuiz = async (
  chapterText: string,
  bookName: string,
  chapterNum: string,
  difficulty: string = 'medio',
  topic: string = 'general'
): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Genera un quiz de 5 preguntas de opcion multiple basado en ${bookName} ${chapterNum}.
Dificultad: ${difficulty}. Tema: ${topic}.
Texto: "${chapterText.substring(0, 12000)}"

Formato JSON: array de { question, options: string[], correctIndex: number, explanation: string }
Responde SOLO con el JSON, sin markdown.`;

    const response = await callGeminiDirect({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });

    const jsonStr = (response.text || '[]').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
};

export interface TriviaRecommendation {
  title: string;
  description: string;
  prompt: string;
}

export interface TriviaResult {
  recommendations: TriviaRecommendation[];
  achievement?: {
    title: string;
    description: string;
    icon: string;
  };
}

export const generateTriviaRecommendations = async (
  bookName: string,
  chapterNum: string,
  score: number,
  totalQuestions: number,
  topic: string
): Promise<TriviaResult> => {
  try {
    const perf = score / totalQuestions;
    const context = perf === 1
      ? 'Puntaje perfecto. Sugiere temas avanzados.'
      : perf >= 0.8
        ? 'Casi perfecto. Sugiere temas profundos.'
        : perf >= 0.6
          ? 'Regular. Sugiere repasar fundamentos.'
          : 'Bajo. Anima y sugiere temas basicos.';

    const prompt = `Un usuario hizo trivia sobre ${bookName} ${chapterNum} (Tema: ${topic}). Puntaje: ${score}/${totalQuestions}. ${context}

Formato JSON: { recommendations: [{ title, description, prompt }], achievement: { title, description, icon } }
Responde SOLO el JSON, sin markdown.`;

    const response = await callGeminiDirect({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    const jsonStr = (response.text || '{}').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return { recommendations: [] };
  }
};

export const generateBiblicalImage = async (verseText: string): Promise<string | null> => {
  try {
    const prompt = `Sacred biblical art: ${verseText}. Painting style, warm lighting, respectful representation.`;

    const response = await callGeminiDirect({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    });

    const imageData = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    )?.inlineData?.data;

    return imageData ? `data:image/png;base64,${imageData}` : null;
  } catch {
    return null;
  }
};

export const checkContentSafety = async (text: string): Promise<boolean> => {
  try {
    const prompt = `Analiza si este texto es seguro para una app cristiana: "${text}". Responde SOLO "SAFE" o "UNSAFE".`;

    const response = await callGeminiDirect({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
    });

    return response.text?.trim().toUpperCase() === 'SAFE';
  } catch {
    return true;
  }
};
