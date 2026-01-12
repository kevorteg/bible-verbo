
import { Modality } from "@google/genai";
import { ai, CHAT_MODEL_STANDARD, TTS_MODEL, IMAGE_MODEL } from "./geminiService";
import { decodeBase64, decodeAudioData } from "./audioUtils";
import { QuizQuestion } from "../types";

export const generatePodcastEpisode = async (
    text: string,
    title: string,
    tone: 'fun' | 'deep' | 'meditative' = 'fun'
): Promise<{ buffer: AudioBuffer, blob: Blob } | null> => {
    try {
        let audioContext: AudioContext | null = null;
        // --- PASO 1: EL GUIONISTA (MODELO DE TEXTO) ---
        // Aquí definimos CÓMO deben actuar los personajes según el tono elegido.

        let toneInstruction = "";
        let introInstruction = "";

        if (tone === 'fun') {
            toneInstruction = "Estilo: Dinámico, juvenil, con bromas ligeras, energía alta. Como dos youtubers cristianos.";
            introInstruction = "Kevin debe iniciar diciendo: '¡Hola a todos! Bienvenidos a VerboCast desde Misión Juvenil'.";
        } else if (tone === 'deep') {
            toneInstruction = "Estilo: Profundo, teológico, serio pero apasionado. Analizando contexto histórico.";
            introInstruction = "Kevin debe iniciar diciendo: 'Saludos, esto es VerboCast, una iniciativa de Misión Juvenil para profundizar en la Palabra'.";
        } else if (tone === 'meditative') {
            toneInstruction = "Estilo: Calmado, suave, devocional, ritmo lento y mucha paz.";
            introInstruction = "Kevin debe iniciar con voz suave: 'Bienvenidos a este espacio de paz en VerboCast, de Misión Juvenil'.";
        }

        const scriptPrompt = `
        (NOTA DE DIRECCIÓN: El output debe ser en Español Latinoamericano neutro. Evita terminología, modismos o acentos de España. Usa un tono fresco y joven sin sonar forzado.)

        Actúa como el productor del podcast "VerboCast".
        Genera un guion de conversación de aprox 2 minutos sobre este texto bíblico:
        "${text.substring(0, 8000)}..."

        ${toneInstruction}
        
        REGLA DE ORO (INICIO):
        ${introInstruction}

        PERSONAJES:
        - Kevin: Voz masculina.
        - Liz: Voz femenina.

        FORMATO ESTRICTO DE SALIDA (Solo el diálogo):
        Kevin: [Texto]
        Liz: [Texto]
        Kevin: [Texto]
        ...
        `;

        // Llamamos a Gemini (versión texto) para que escriba el guion
        const scriptResponse = await ai.models.generateContent({
            model: CHAT_MODEL_STANDARD,
            contents: [{ parts: [{ text: scriptPrompt }] }]
        });

        const script = scriptResponse.text;
        if (!script) throw new Error("No script generated");

        // --- PASO 2: EL ESTUDIO DE GRABACIÓN (MODELO DE AUDIO) ---
        // Tomamos el guion generado arriba y se lo damos al modelo TTS Multi-Voz

        const promptTTS = `TTS the following conversation:\n${script}`;

        const audioResponse = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: promptTTS }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Kevin',
                                // Puck es una voz masculina más joven y dinámica
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                            },
                            {
                                speaker: 'Liz',
                                // Kore es una voz femenina clara
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                            }
                        ]
                    }
                }
            }
        });

        // --- PASO 3: PROCESAMIENTO DE AUDIO (BINARIO) ---
        const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
            if (!audioContext) {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (audioContext.state === 'suspended') await audioContext.resume();

            const audioBytes = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioContext);

            // Convert to Blob for download (assuming MP3 from Gemini)
            const blob = new Blob([audioBytes as any], { type: 'audio/mp3' });

            return { buffer: audioBuffer, blob };
        }
        return null;

    } catch (e) {
        console.error("Error generating podcast", e);
        return null;
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

export const generateChapterQuiz = async (
    chapterText: string,
    bookName: string,
    chapterNum: string,
    difficulty: string = 'medio',
    topic: string = 'general'
): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Genera un quiz de 5 preguntas de opción múltiple basado EXCLUSIVAMENTE en el siguiente texto bíblico de ${bookName} ${chapterNum}.
        
        CONFIGURACIÓN:
        - Dificultad: ${difficulty.toUpperCase()} 
          (Explorador/Fácil: Preguntas literales y básicas. 
           Discípulo/Medio: Preguntas de comprensión. 
           Maestro/Difícil: Preguntas de análisis teológico profundo).
        - Enfoque Temático: ${topic.toUpperCase()} (Centra las preguntas en este tema: Historia, Teología, Personajes o Aplicación Práctica).
        
        TEXTO BÍBLICO: "${chapterText.substring(0, 12000)}..."

        REGLAS DE FORMATO JSON:
        Devuelve SOLO un JSON válido (sin markdown \`\`\`json) con este formato array:
        [
          {
            "question": "¿Pregunta?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctIndex": 0, // Índice de la respuesta correcta (0-3)
            "explanation": "Breve explicación educativa de por qué es la correcta y dónde encontrarla en el texto."
          }
        ]
        `;

        const response = await ai.models.generateContent({
            model: CHAT_MODEL_STANDARD,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonStr = response.text || "[]";
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Error generating quiz", e);
        return [];
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
        return true;
    }
};
