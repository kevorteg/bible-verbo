import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import * as AuthService from '../services/authService';
import * as UserService from '../services/userService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStats: (newStats: Partial<User['stats']>) => void;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  checkInDaily: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionUser = await AuthService.getSession();
        setUser(sessionUser);
      } catch {
        // No session
      } finally {
        setIsLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        try {
          const fullUser = await AuthService.getSession();
          setUser(fullUser);
        } catch {}
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const loggedInUser = await AuthService.login(email, pass);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const newUser = await AuthService.register(name, email, pass);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    try {
      await UserService.updateUserProfile(user.id, updates);
    } catch {}
  }, [user]);

  const updateStats = useCallback(async (newStats: Partial<User['stats']>) => {
    if (user) {
      const updatedUser = { ...user, stats: { ...user.stats, ...newStats } as any };
      setUser(updatedUser);
      try {
        await AuthService.updateUserStats(user, newStats);
      } catch {}
    }
  }, [user]);

  const checkInDaily = useCallback(async () => {
    if (!user?.stats) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.stats.lastActivityDate || '';

    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = user.stats.streakDays || 0;
    newStreak = lastDate === yesterdayStr ? newStreak + 1 : 1;

    await updateStats({
      streakDays: newStreak,
      lastActivityDate: today,
    });
  }, [user, updateStats]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateStats, updateProfile, checkInDaily }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};
