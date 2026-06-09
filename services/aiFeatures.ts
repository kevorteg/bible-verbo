import { callGeminiProxy, callGeminiHeavyProxy, CHAT_MODEL_STANDARD, TTS_MODEL, generateBiblicalImage, generateChapterQuiz, checkContentSafety } from "./geminiService";
import { decodeBase64, pcmToWavBlob, audioBufferToWav } from "./audioUtils";

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
        (NOTA DE DIRECCIÓN: El output debe ser en Español Latinoamericano neutro. Evita terminología o acentos de España. Usa un tono fresco, joven y dinámico pero PROFUNDAMENTE RESPETUOSO y CRISTIANO.)

        PROHIBICIONES ESTRICTAS:
        - NO uses jerga de calle ni modismos informales (ESTRICTAMENTE PROHIBIDO usar palabras como "parce", "parcero", "pana", "wey" o similares).
        - El lenguaje debe ser digno de una iglesia (IPUC), manteniendo una alta reverencia por la Palabra de Dios, aunque el formato sea juvenil.
        - NO uses lenguaje secular para referirte a cosas santas.

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
        // Usamos el proxy pesado porque el guion largo puede tardar
        const scriptResponse = await callGeminiHeavyProxy({
            model: CHAT_MODEL_STANDARD,
            contents: [{ parts: [{ text: scriptPrompt }] }]
        });

        const script = scriptResponse.text;
        if (!script) throw new Error("No script generated");

        // --- PASO 2: EL ESTUDIO DE GRABACIÓN (MODELO DE AUDIO) ---
        // Tomamos el guion generado arriba y se lo damos al modelo TTS Multi-Voz

        const promptTTS = `Genera un podcast en español entre Kevin y Liz:\n${script}`;

        const audioResponse = await callGeminiHeavyProxy({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: promptTTS }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Kevin',
                                // Fenrir: voz masculina profunda y natural
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
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
            // Decodificamos de base64 a bytes crudos PCM
            const pcmBytes = decodeBase64(base64Audio);

            // Opción 1: Crear un WAV básico directamente de los bytes (rápido)
            const basicWavBlob = pcmToWavBlob(pcmBytes, 24000, 1);

            // Necesitamos el AudioContext para tener la duración exacta y procesarlo
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const arrayBuffer = await basicWavBlob.arrayBuffer();
            const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Opción 2: Usar nuestra nueva función robusta para generar el Blob descargable final
            // a partir del buffer decodificado y confiable del navegador:
            const finalWavBlob = audioBufferToWav(decodedAudioBuffer);

            return { buffer: decodedAudioBuffer, blob: finalWavBlob };
        }
        return null;

    } catch (e) {
        console.error("Error generating podcast", e);
        return null;
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
        let recommendationContext = "";
        let achievementContext = "";

        if (perf === 1) {
            recommendationContext = "Puntaje perfecto. Sugiérele temas muy avanzados o teológicos de " + bookName + " " + chapterNum + ".";
            achievementContext = "Genera una MEDALLA DE EXPERTO majestuosa, épica y muy reverente sobre el texto.";
        } else if (perf >= 0.8) {
            recommendationContext = "Puntaje casi perfecto. Sugiérele temas profundos de " + bookName + " " + chapterNum + ".";
            achievementContext = "Genera una MEDALLA DE EXPERTO honorable y sabia sobre el texto.";
        } else if (perf >= 0.6) {
            recommendationContext = "Puntaje regular. Sugiérele repasar algún tema fundamental de " + bookName + " " + chapterNum + ".";
            achievementContext = "Genera una MEDALLA DIVERTIDA TIPO 'TROLL' (Pero sana y amorosa) para alguien que se distrajo leyendo.";
        } else {
            recommendationContext = "Puntaje bajo. Anímalo y sugiérele historias básicas relacionadas o una explicación muy sencilla de " + bookName + " " + chapterNum + ".";
            achievementContext = "Genera una MEDALLA DIVERTIDA TIPO 'TROLL' (sana y amorosa) sobre un personaje que cometió un error o no sabía, como consuelo.";
        }

        const prompt = `Un usuario acaba de jugar una trivia bíblica sobre ${bookName} ${chapterNum} (Tema: ${topic}).
        Puntaje del usuario: ${score} de ${totalQuestions}.

        TAREA 1: ${recommendationContext}
        TAREA 2: ${achievementContext}

        REGLAS DE FORMATO JSON:
        Devuelve SOLO un objeto JSON válido (sin markdown \`\`\`json) con este formato EXACTO:
        {
          "recommendations": [
            {
              "title": "Título corto y llamativo",
              "description": "Breve frase explicando por qué estudiar esto a continuación.",
              "prompt": "Texto exacto que el usuario mandará a la IA para empezar a estudiar esto"
            },
            {...} // 2do elemento
          ],
          "achievement": {
            "title": "Nombre de la medalla (Máx 4 palabras)",
            "description": "El mensaje alusivo al personaje/libro y al puntaje",
            "icon": "Un solo EMOJI aplicable a la medalla"
          }
        }
        `;

        const response = await callGeminiProxy({
            model: CHAT_MODEL_STANDARD,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonStr = response.text || "{}";
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson) as TriviaResult;
    } catch (e) {
        console.error("Error generating recommendations and achievement", e);
        return { recommendations: [] };
    }
};
