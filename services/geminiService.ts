import { ChatMessage, QuizQuestion } from '../types';
import { getMjSystemPromptInfo } from '../mj_info';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const fallbackResponses = [
  '"Bienaventurados los que tienen hambre y sed de justicia, porque ellos seran saciados." Mateo 5:6',
  'La Palabra de Dios dice: "No temas, porque yo estoy contigo." Isaías 41:10',
  '"Porque yo se los pensamientos que tengo acerca de vosotros, pensamientos de paz, y no de mal." Jeremias 29:11',
  'Jesus dijo: "Venid a mi todos los que estais trabajados y cargados, y yo os hare descansar." Mateo 11:28',
  '"Todo lo puedo en Cristo que me fortalece." Filipenses 4:13',
  'La fe es la certeza de lo que se espera, la conviccion de lo que no se ve. (Hebreos 11:1)',
  'El amor de Dios ha sido derramado en nuestros corazones por el Espiritu Santo. (Romanos 5:5)',
  'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. (Salmo 46:1)',
  'Gracias por tu mensaje. En estos momentos no puedo conectarme con la IA, pero recuerda que Dios te ama y tiene un proposito para tu vida.',
  'Sigue buscando a Dios en oracion y en Su Palabra. El siempre responde en el momento perfecto.',
];

function getRandomFallback(): string {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

export async function callGeminiDirect(payload: any) {
  const url = `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text && !data.text) {
      data.text = data.candidates[0].content.parts[0].text;
    }
    return data;
  } catch (error) {
    console.error('Gemini Fetch Error:', error);
    throw error;
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemContext?: string
): Promise<string> {
  try {
    const systemPrompt = systemContext || getMjSystemPromptInfo();

    const contents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const data = await callGeminiDirect(payload);
    return data.text || getRandomFallback();
  } catch {
    return getRandomFallback();
  }
}

const fallbackQuiz: QuizQuestion[] = [
  { question: 'Cuantos libros tiene la Biblia?', options: ['A) 27', 'B) 39', 'C) 66', 'D) 73'], correctIndex: 2, explanation: 'La Biblia tiene 66 libros: 39 en el Antiguo Testamento y 27 en el Nuevo Testamento.' },
  { question: 'Quien construyo el arca en el Antiguo Testamento?', options: ['A) Moises', 'B) Abraham', 'C) Noe', 'D) David'], correctIndex: 2, explanation: 'Dios le ordeno a Noe construir un arca para salvar a su familia y a los animales.' },
  { question: 'Cual es el mandamiento mas importante segun Jesus?', options: ['A) No robar', 'B) Amar a Dios y al projimo', 'C) Guardar el sabado', 'D) Diezmar'], correctIndex: 1, explanation: 'Jesus dijo que el amor a Dios y al projimo es el mandamiento mas importante.' },
];

export async function generateQuiz(
  difficulty: string = 'facil',
  topic: string = 'general',
  bookName?: string,
  chapterNum?: string,
  verses?: string
): Promise<QuizQuestion[]> {
  try {
    let context = '';
    if (bookName && chapterNum) {
      context = `\nContexto: ${bookName} ${chapterNum}\n${verses ? `Versiculos: ${verses}` : ''}`;
    }

    const prompt = `Genera 3 preguntas de opcion multiple biblicas con dificultad ${difficulty} y tema ${topic}.${context}

Formato JSON requerido:
[
  {
    "question": "Pregunta aqui",
    "options": ["A) Opcion 1", "B) Opcion 2", "C) Opcion 3", "D) Opcion 4"],
    "correctIndex": 0,
    "explanation": "Explicacion breve"
  }
]

Responde SOLO con el JSON, sin markdown ni texto adicional.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    };

    const data = await callGeminiDirect(payload);
    const jsonText = data.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonText);
  } catch {
    return fallbackQuiz;
  }
}

export async function generateVerboCast(
  bookName: string,
  chapterNum: string,
  verses: string,
  style: string
): Promise<string> {
  try {
    const prompt = `Eres un presentador de podcast juvenil y energetico. Crea un episodio de VerboCast sobre ${bookName} ${chapterNum} en estilo ${style}.

Contexto:
${verses}

Estructura del episodio:
1. Introduccion llamativa (15 segundos)
2. Lectura del pasaje
3. Reflexion juvenil y aplicacion practica
4. Oracion guiada
5. Cierre motivacional

Escribe el guion completo del episodio.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    };

    const data = await callGeminiDirect(payload);
    return data.text || 'No se pudo generar el episodio en este momento. Intenta de nuevo mas tarde.';
  } catch {
    return 'No se pudo generar el episodio en este momento. Intenta de nuevo mas tarde.';
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    };

    const data = await callGeminiDirect(payload);
    const imageData = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    )?.inlineData?.data;
    return imageData || null;
  } catch {
    return null;
  }
}
