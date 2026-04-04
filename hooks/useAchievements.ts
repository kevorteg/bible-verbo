import { useState, useEffect } from 'react';
import { Achievement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as UserService from '../services/userService';

// Key for local storage
const LOCAL_STORAGE_KEY = 'verbo_achievements';

export const useAchievements = () => {
    const { user, updateStats } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize/sync on mount and auth state change
    useEffect(() => {
        const loadAchievements = async () => {
            try {
                // 1. Get from local storage
                const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
                let localAchievements: Achievement[] = [];
                if (localStr) {
                    try {
                        localAchievements = JSON.parse(localStr);
                    } catch (e) {
                         console.error("Error parsing local achievements", e);
                    }
                }

                if (user) {
                    // 2. We are logged in -> merge local with user stats and push to DB if Local had something new
                    let dbAchievements: Achievement[] = (user.stats as any)?.achievements || [];
                    
                    // Merge based on ID
                    const mergedMap = new Map<string, Achievement>();
                    dbAchievements.forEach(a => mergedMap.set(a.id, a));
                    localAchievements.forEach(a => mergedMap.set(a.id, a));
                    
                    const mergedArray = Array.from(mergedMap.values());
                    
                    setAchievements(mergedArray);
                    
                    // If local had things that db didn't, or simply to keep DB updated with merged
                    if (mergedArray.length > dbAchievements.length) {
                        updateStats({ achievements: mergedArray });
                    }
                } else {
                    // Not logged in -> just use local
                    setAchievements(localAchievements);
                }
            } catch (error) {
                console.error("Error loading achievements:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadAchievements();
    }, [user, updateStats]);

    const saveAchievement = (newAchievement: Achievement) => {
        setAchievements((prev) => {
            // Check if already got this one
            if (prev.some(a => a.id === newAchievement.id)) return prev;

            const updated = [...prev, newAchievement];
            
            // Save to local storage always
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

            // Sync to DB if logged in
            if (user) {
                updateStats({ achievements: updated });
            }

            return updated;
        });
    };

    return { achievements, saveAchievement, isLoaded };
};
