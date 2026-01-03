
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as AuthService from '../services/authService';
import * as UserService from '../services/userService'; 
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithMagicCode: (email: string) => Promise<void>; // NUEVO
  register: (name: string, email: string, pass: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>; // NUEVO
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
        } catch (e) {
            console.error("Error restoring session", e);
        } finally {
            setIsLoading(false);
        }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         if (!user) {
             try {
                const fullUser = await AuthService.getSession();
                setUser(fullUser);
             } catch (e) { console.error(e); }
         }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]); 

  const login = async (email: string, pass: string) => {
    const user = await AuthService.login(email, pass);
    setUser(user);
  };

  const loginWithMagicCode = async (email: string) => {
      await AuthService.loginWithMagicCode(email);
  };

  const register = async (name: string, email: string, pass: string) => {
    const user = await AuthService.register(name, email, pass);
    setUser(user);
  };

  const verifyOtp = async (email: string, token: string) => {
    const user = await AuthService.verifyEmailOtp(email, token);
    setUser(user);
  };

  const resendCode = async (email: string) => {
      await AuthService.resendSignUpCode(email);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: { name?: string; avatar?: string }) => {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      try {
          await UserService.updateUserProfile(user.id, updates);
          if (updates.name) {
              await supabase.auth.updateUser({
                  data: { full_name: updates.name }
              });
          }
      } catch (e) {
          console.error("Error saving profile updates:", e);
      }
  };

  const updateStats = async (newStats: Partial<User['stats']>) => {
      if (user) {
          const updatedUser = { ...user, stats: { ...user.stats, ...newStats } as any };
          setUser(updatedUser);
          try {
            await AuthService.updateUserStats(user, newStats);
          } catch (e) { console.error(e); }
      }
  };

  const checkInDaily = async () => {
      if (!user || !user.stats) return;

      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.stats.lastActivityDate || '';
      
      if (lastDate === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = user.stats.streakDays || 0;

      if (lastDate === yesterdayStr) {
          newStreak += 1;
      } else {
          newStreak = 1;
      }

      await updateStats({ 
          streakDays: newStreak,
          lastActivityDate: today
      });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithMagicCode, register, verifyOtp, resendCode, logout, updateStats, updateProfile, checkInDaily }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};
