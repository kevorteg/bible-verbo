import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Character, CharacterReaction, getGuide, getRandomCharacter, REACTION_MESSAGES } from '../services/characterData';

interface CharacterContextType {
  activeCharacter: Character;
  reaction: CharacterReaction;
  message: string;
  setReaction: (reaction: CharacterReaction, customMessage?: string) => void;
  selectCharacter: (id: string) => void;
  randomCharacter: () => void;
  triggerCelebration: (customMessage?: string) => void;
  triggerEncouragement: (customMessage?: string) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [activeCharacter, setActiveCharacter] = useState<Character>(getGuide());
  const [reaction, setReactionState] = useState<CharacterReaction>('idle');
  const [message, setMessage] = useState('');

  const setReaction = useCallback((newReaction: CharacterReaction, customMessage?: string) => {
    setReactionState(newReaction);
    const messages = REACTION_MESSAGES[newReaction];
    const msg = customMessage || messages[Math.floor(Math.random() * messages.length)];
    setMessage(msg);
  }, []);

  const selectCharacter = useCallback((id: string) => {
    const { getCharacter } = require('../services/characterData');
    const char = getCharacter(id);
    if (char) {
      setActiveCharacter(char);
      setReaction('idle');
    }
  }, [setReaction]);

  const randomCharacter = useCallback(() => {
    setActiveCharacter(getRandomCharacter());
    setReaction('happy');
  }, [setReaction]);

  const triggerCelebration = useCallback((customMessage?: string) => {
    setReaction('celebrate', customMessage);
    setTimeout(() => setReactionState('idle'), 3000);
  }, [setReaction]);

  const triggerEncouragement = useCallback((customMessage?: string) => {
    setReaction('encourage', customMessage);
    setTimeout(() => setReactionState('idle'), 4000);
  }, [setReaction]);

  return (
    <CharacterContext.Provider
      value={{
        activeCharacter,
        reaction,
        message,
        setReaction,
        selectCharacter,
        randomCharacter,
        triggerCelebration,
        triggerEncouragement,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextType {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
