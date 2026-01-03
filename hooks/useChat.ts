import { useState, useEffect } from 'react';
import { ChatMessage, Verse, Book, Chapter } from '../types';
import * as GeminiService from '../services/geminiService';
import * as UserService from '../services/userService';

// Definimos la interfaz del usuario localmente o importamos de types si es necesario
interface User {
    id: string;
    name: string;
}

export const useChat = (
    user: User | null,
    onNavigate: (text: string) => void,
    setCurrentView: (view: 'reader' | 'dashboard' | 'map' | 'community' | 'admin') => void,
    setSidebarOpen: (open: boolean) => void
) => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'assistant', text: '¡Hola! Soy Verbo. Estoy listo para navegar la Biblia contigo.', id: 'init' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    // Cargar historial al iniciar sesión
    useEffect(() => {
        const syncChat = async () => {
            if (user) {
                try {
                    const dbChat = await UserService.syncChatHistory(user.id);
                    if (dbChat.length > 0) {
                        setChatMessages(dbChat);
                    } else {
                        setChatMessages([{ role: 'assistant', text: `¡Hola ${user.name}! Soy Verbo. Tus conversaciones ahora son privadas y seguras.`, id: 'init-auth' }]);
                    }
                } catch (e) {
                    console.error("Error al sincronizar chat", e);
                }
            } else {
                setChatMessages([{ role: 'assistant', text: '¡Hola! Soy Verbo. Inicia sesión para guardar tu progreso.', id: 'init' }]);
            }
        };
        syncChat();
    }, [user]);

    const sendMessage = async (
        text: string,
        selectedVerse: Verse | null,
        currentBook: Book | null,
        currentChapter: Chapter | null,
        isStudy: boolean = false,
        location?: { latitude: number, longitude: number }
    ) => {
        if (!text || !text.trim() || isTyping) return;

        const userMsg: ChatMessage = { role: 'user', text: String(text), id: Date.now().toString() };
        setChatMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        if (user) UserService.saveChatMessage(user.id, userMsg);

        // Contexto para la IA
        const verseContext = selectedVerse
            ? `"${selectedVerse.text}" (${currentBook?.name} ${currentChapter?.number}:${selectedVerse.number})`
            : `Capítulo ${currentChapter?.number} de ${currentBook?.name}`;

        // Intentar navegar si el usuario escribe una cita
        onNavigate(text);

        const responseText = await GeminiService.generateChatResponse(
            [...chatMessages, userMsg],
            verseContext,
            isStudy,
            location
        );

        // Navegación automática sugerida por IA
        const navMatch = responseText.match(/\[NAV:\s*(.+?)\s*\]/);
        if (navMatch) {
            setTimeout(() => onNavigate(navMatch[1]), 100);
        } else {
            // FALLBACK: Si la IA olvida la etiqueta [NAV], intentamos encontrar una cita en el texto visible
            // Limpiamos el texto de cualquier otra etiqueta rota por si acaso
            const cleanForCheck = responseText.replace(/\[NAV:.+?\]/g, "").trim();
            // Solo intentamos navegar si la función de navegación detecta un libro válido
            setTimeout(() => onNavigate(cleanForCheck), 100);
        }

        // Map Data Handling
        if (responseText.includes('<<<MAP_DATA_START>>>')) {
            setCurrentView('map');
            if (window.innerWidth < 1024) setSidebarOpen(false);
        }

        const cleanText = responseText.replace(/\[NAV:.+?\]/g, "").trim();
        const assistantMsg: ChatMessage = { role: 'assistant', text: cleanText, id: (Date.now() + 1).toString() };

        if (user) UserService.saveChatMessage(user.id, assistantMsg);
        setChatMessages(prev => [...prev, { role: 'assistant', text: "", id: assistantMsg.id }]);

        // Efecto Typewriter
        let currentStr = "";
        const words = cleanText.split(" ");
        for (let i = 0; i < words.length; i++) {
            currentStr += (i > 0 ? " " : "") + words[i];
            setChatMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, text: currentStr } : m));
            await new Promise(r => setTimeout(r, 20));
        }
        setIsTyping(false);
    };

    const generateImage = async (selectedVerse: Verse | null) => {
        if (!selectedVerse || isTyping) return;
        setIsTyping(true);
        const imageUrl = await GeminiService.generateBiblicalImage(selectedVerse.text);
        const msg: ChatMessage = { id: Date.now().toString(), role: 'assistant', text: imageUrl ? "Aquí tienes una representación artística:" : "Error al generar imagen.", image: imageUrl || undefined };
        setChatMessages(prev => [...prev, msg]);
        if (user) UserService.saveChatMessage(user.id, msg);
        setIsTyping(false);
    };

    const clearChat = async () => {
        if (user) await UserService.clearChatHistory(user.id);
        setChatMessages([{ role: 'assistant', text: 'Chat reiniciado.', id: Date.now().toString() }]);
    };

    return {
        chatMessages,
        isTyping,
        sendMessage,
        generateImage,
        speak: GeminiService.generateSpeech,
        clearChat,
        setChatMessages // Por si necesitamos setear manual (ej. reset)
    };
}
