import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '../types';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'verbo_achievements';

export const useAchievements = () => {
  const { user, updateStats } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const localStr = await AsyncStorage.getItem(STORAGE_KEY);
        let localAchievements: Achievement[] = [];
        if (localStr) {
          try { localAchievements = JSON.parse(localStr); } catch {}
        }

        if (user) {
          const dbAchievements: Achievement[] = user.stats?.achievements || [];
          const mergedMap = new Map<string, Achievement>();
          dbAchievements.forEach(a => mergedMap.set(a.id, a));
          localAchievements.forEach(a => mergedMap.set(a.id, a));
          const mergedArray = Array.from(mergedMap.values());
          setAchievements(mergedArray);
          if (mergedArray.length > dbAchievements.length) {
            updateStats({ achievements: mergedArray });
          }
        } else {
          setAchievements(localAchievements);
        }
      } catch {} finally {
        setIsLoaded(true);
      }
    };

    loadAchievements();
  }, [user, updateStats]);

  const saveAchievement = (newAchievement: Achievement) => {
    setAchievements((prev) => {
      if (prev.some(a => a.id === newAchievement.id)) return prev;
      const updated = [...prev, newAchievement];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (user) updateStats({ achievements: updated });
      return updated;
    });
  };

  return { achievements, saveAchievement, isLoaded };
};
