
import { GoogleGenAI, Modality } from "@google/genai";
import { ChatMessage, QuizQuestion } from "../types";
import { getMjSystemPromptInfo } from "../mj_info";
import { decodeBase64, decodeAudioData } from "./audioUtils";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Models
const CHAT_MODEL_STANDARD = 'gemini-3-flash-preview';
const CHAT_MODEL_MAPS = 'gemini-2.5-flash'; // Maps grounding solo funciona en 2.5
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const generateChatResponse = async (
  history: ChatMessage[],
  verseContext: string | null,
  isStudy: boolean = false,
  userLocation?: { latitude: number; longitude: number } // Nuevo parámetro opcional
): Promise<string> => {
  try {
    const mjInfo = getMjSystemPromptInfo();

    const systemPrompt = `Eres Verbo, un mentor bíblico y compañero universitario de Misión Juvenil (MJ).

    ${mjInfo}

    TU PERSONALIDAD:
    - Eres conciso y directo en conversaciones casuales.
    - Eres estructurado y pedagógico cuando enseñas teología o historia.

    UBICACIÓN DE IGLESIAS (CRÍTICO):
    - Si el usuario comparte su ubicación, tu TAREA PRINCIPAL es usar Google Maps para encontrar **TODAS** las congregaciones "Iglesia Pentecostal Unida de Colombia" (IPUC) cercanas.
    - **NO** te limites a las más grandes. Busca también sedes de barrio (Ej: "IPUC Guayaquil", "IPUC La Floresta", "IPUC Central").
    - Si el usuario pregunta por una sede específica (ej: "IPUC Guayaquil"), búscala específicamente en el mapa.
    - **PRECISIÓN DE NOMBRES:** Usa SIEMPRE el nombre oficial que aparece en el mapa.
    
    **GENERACIÓN DE DATOS DE MAPA (ESTRICTO):**
    Si encuentras iglesias, AL FINAL de tu respuesta, genera un bloque de datos oculto para que el sistema dibuje el mapa.
    Formato OBLIGATORIO:
    <<<MAP_DATA_START>>>
    [
      { "name": "IPUC Guayaquil", "lat": 3.4372, "lng": -76.5225, "address": "Cl. 15 #23-23" },
      { "name": "IPUC Central", "lat": 3.4516, "lng": -76.5320, "address": "Cra 8 #12" }
    ]
    <<<MAP_DATA_END>>>
    
    Asegúrate de extraer las coordenadas de la herramienta de mapas. El JSON debe ser válido.

    DEBES USAR ETIQUETAS DE NAVEGACIÓN [NAV:...] (CRÍTICO):
    - Cada vez que menciones una cita bíblica (Ej: "Juan 3:16", "Salmos 23"), DEBES incluir al final de la frase la etiqueta oculta [NAV:Libro Cap:Verso].
    - Ejemplo: "Porque de tal manera amó Dios al mundo... como dice Juan 3:16 [NAV:Juan 3:16]"
    - ESTO ES OBLIGATORIO PARA QUE LA APP MUESTRE EL VERSÍCULO AUTOMÁTICAMENTE. NO OLVIDES ESTA ETIQUETA.

    Contexto actual (si aplica): ${verseContext || "Conversación general"}`;

    // Convert internal history to Gemini format
    const recentHistory = history.slice(-8);
    let conversationStr = "";
    recentHistory.forEach(msg => {
      // Filtramos el bloque de mapa del historial para no confundir al modelo en turnos siguientes
      const textClean = msg.text.replace(/<<<MAP_DATA_START>>>[\s\S]*?<<<MAP_DATA_END>>>/, '').trim();
      conversationStr += `${msg.role === 'user' ? 'User' : 'Model'}: ${textClean}\n`;
    });

    // CONFIGURACIÓN DINÁMICA: Si hay ubicación, usamos Maps Grounding y modelo 2.5
    const modelToUse = userLocation ? CHAT_MODEL_MAPS : CHAT_MODEL_STANDARD;
    const toolsConfig = userLocation ? [{ googleMaps: {} }] : undefined;
    const retrievalConfig = userLocation ? { retrievalConfig: { latLng: userLocation } } : undefined;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [
        { role: 'user', parts: [{ text: conversationStr }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        tools: toolsConfig,
        toolConfig: retrievalConfig
      }
    });

    let finalText = response.text || "No pude procesar la respuesta.";

    return finalText;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Lo siento, hubo un error técnico. Por favor intenta de nuevo.";
  }
};

// Variables globales para controlar la reproducción de audio (Singleton)
let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const generateSpeech = async (text: string): Promise<void> => {
  try {
    // 1. Detener audio anterior si existe
    if (currentSource) {
      try { currentSource.stop(); } catch (e) { /* Ignorar error si ya paró */ }
      currentSource = null;
    }
    if (currentAudioContext) {
      try { await currentAudioContext.close(); } catch (e) { /* Ignorar */ }
      currentAudioContext = null;
    }

    // Limpiamos el texto de bloques de datos antes de hablar
    const speechText = text.replace(/<<<MAP_DATA_START>>>[\s\S]*?<<<MAP_DATA_END>>>/g, '')
      .replace(/\[CONTACTO:.*?\]/g, 'Contacto disponible en pantalla.')
      .replace(/\[NAV:.*?\]/g, '');

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: speechText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      // 2. Crear nuevo contexto y fuente
      currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, currentAudioContext!);

      currentSource = currentAudioContext!.createBufferSource();
      currentSource.buffer = audioBuffer;
      currentSource.connect(currentAudioContext!.destination);

      // 3. Reproducir
      currentSource.start();

      // Limpieza automática al terminar
      currentSource.onended = () => {
        currentSource = null;
        // No cerramos el context inmediatamente para evitar cortes abruptos, o lo dejamos para la siguiente llamada
      };
    }
  } catch (error) {
    console.error("Gemini TTS Error:", error);
  }
};

export const generateBiblicalImage = async (verseText: string): Promise<string | null> => {
  try {
    const prompt = `Sacred biblical art: ${verseText}. Painting style, warm lighting, respectful representation.`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // Nano banana (flash-image) usually returns inlineData
      }
    });

    // Check parts for image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const generateChapterQuiz = async (chapterText: string, bookName: string, chapterNum: string, difficulty: string = 'medio', topic: string = 'general'): Promise<QuizQuestion[]> => {
  try {
    const modelToUse = 'gemini-1.5-flash';

    let difficultyPrompt = "";
    switch (difficulty) {
      case 'facil': difficultyPrompt = "Nivel Explorador: Preguntas básicas y hechos literales fáciles de encontrar en el texto."; break;
      case 'medio': difficultyPrompt = "Nivel Discípulo: Preguntas que requieren comprensión lectora y relación de ideas."; break;
      case 'dificil': difficultyPrompt = "Nivel Maestro: Preguntas teológicas profundas, simbolismos o análisis detallado."; break;
      default: difficultyPrompt = "Nivel Discípulo: Preguntas que requieren comprensión lectora y relación de ideas."; break;
    }

    let topicPrompt = "";
    switch (topic) {
      case 'general': topicPrompt = "Variado: Mezcla hechos, personajes y enseñanzas."; break;
      case 'historia': topicPrompt = "Enfoque Histórico: Céntrate en cronología, lugares, eventos y contexto cultural."; break;
      case 'teologia': topicPrompt = "Enfoque Teológico: Céntrate en doctrinas, atributos de Dios y significados espirituales."; break;
      case 'aplicacion': topicPrompt = "Enfoque Práctico: Céntrate en lecciones de vida y aplicación moderna de los principios."; break;
      default: topicPrompt = "Variado: Mezcla hechos, personajes y enseñanzas."; break;
    }

    const prompt = `
      Actúa como un profesor experto de Biblia. Genera un quiz de 3 preguntas de opción múltiple basado EXCLUSIVAMENTE en el siguiente texto de ${bookName} ${chapterNum}.
      
      CONFIGURACIÓN DEL QUIZ:
      - Dificultad: ${difficultyPrompt}
      - Tema: ${topicPrompt}

      TEXTO BÍBLICO:
      "${chapterText.substring(0, 8000)}"

      FORMATO JSON REQUERIDO:
      [
        {
          "question": "Pregunta...",
          "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
          "correctIndex": 0, // 0-3
          "explanation": "Breve explicación de por qué es la correcta."
        }
      ]
      IMPORTANTE: Devuelve SOLO el JSON, sin markdown ni texto adicional.
    `;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text || "[]";
    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e: any) {
    console.error("Error generating quiz:", e);
    throw new Error(e.message || "Error desconocido al generar quiz");
  }
};

// NUEVA FUNCIÓN: Verificar contenido seguro para el Muro de Clamor
export const checkContentSafety = async (text: string): Promise<boolean> => {
  try {
    const prompt = `Analiza el siguiente texto de una petición de oración juvenil.
        TEXTO: "${text}"
        
        REGLAS:
        - Si contiene groserías, contenido sexual explícito, odio, violencia extrema o bullying: Responde "UNSAFE".
        - Si es una petición válida (tristeza, ansiedad, fe, estudios, familia, incluso temas delicados como suicidio pero pidiendo ayuda): Responde "SAFE".
        
        SOLO RESPONDE UNA PALABRA: "SAFE" o "UNSAFE".`;

    const response = await ai.models.generateContent({
      model: CHAT_MODEL_STANDARD,
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'SAFE';
  } catch (e) {
    console.error("Safety check error", e);
    return true; // En caso de error técnico, permitimos (fallback) o bloqueamos según política. Por ahora permitimos para no bloquear UX.
  }
};
