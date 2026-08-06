import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import * as GeminiService from '../services/geminiService';
import * as UserService from '../services/userService';

interface User {
  id: string;
  name: string;
}

export const useChat = (user: User | null) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hola! Soy Verbo. Listo para navegar la Biblia contigo.', id: 'init' },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const syncChat = async () => {
      if (user) {
        try {
          const dbChat = await UserService.syncChatHistory(user.id);
          if (dbChat.length > 0) {
            setChatMessages(dbChat);
          } else {
            setChatMessages([{ role: 'assistant', text: `Hola ${user.name}! Soy Verbo. Tus conversaciones ahora son privadas.`, id: 'init-auth' }]);
          }
        } catch {}
      } else {
        setChatMessages([{ role: 'assistant', text: 'Hola! Soy Verbo. Inicia sesion para guardar tu progreso.', id: 'init' }]);
      }
    };
    syncChat();
  }, [user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: String(text), id: Date.now().toString() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    if (user) UserService.saveChatMessage(user.id, userMsg);

    const responseText = await GeminiService.sendChatMessage([...chatMessages, userMsg]);

    const cleanText = responseText.replace(/\[NAV:.+?\]/g, '').trim();
    const assistantMsg: ChatMessage = { role: 'assistant', text: '', id: (Date.now() + 1).toString() };

    if (user) UserService.saveChatMessage(user.id, assistantMsg);
    setChatMessages(prev => [...prev, { ...assistantMsg, text: '' }]);

    let currentStr = '';
    const words = cleanText.split(' ');
    for (let i = 0; i < words.length; i++) {
      currentStr += (i > 0 ? ' ' : '') + words[i];
      setChatMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, text: currentStr } : m));
      await new Promise(r => setTimeout(r, 20));
    }
    setIsTyping(false);
  };

  const clearChat = async () => {
    if (user) await UserService.clearChatHistory(user.id);
    setChatMessages([{ role: 'assistant', text: 'Chat reiniciado.', id: Date.now().toString() }]);
  };

  return { chatMessages, isTyping, sendMessage, clearChat, setChatMessages };
};
