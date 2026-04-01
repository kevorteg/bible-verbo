import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { generateDailyPromise } from '../services/geminiService';
import { User } from '../types';

interface DailyPromiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme: 'dark' | 'light' | 'sepia';
}

interface PromiseData {
  verse: string;
  text: string;
}

export const DailyPromiseModal: React.FC<DailyPromiseModalProps> = ({ isOpen, onClose, user, theme }) => {
  const [promise, setPromise] = useState<PromiseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPromise = async () => {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `verbo_promise_${today}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        setPromise(JSON.parse(cached));
        setLoading(false);
        return;
      }

      setLoading(true);
      const newPromise = await generateDailyPromise(user?.name || undefined);
      setPromise(newPromise);
      localStorage.setItem(cacheKey, JSON.stringify(newPromise));
      setLoading(false);
    };

    fetchPromise();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const bgClasses = theme === 'dark' 
    ? 'bg-[#0f2942]/90 border-blue-500/30' 
    : theme === 'sepia'
    ? 'bg-[#f4ecd8]/95 border-[#e2d5b6]'
    : 'bg-white/95 border-neutral-200';

  const textClass = theme === 'dark' ? 'text-white' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-900';
  const subTextClass = theme === 'dark' ? 'text-blue-200' : theme === 'sepia' ? 'text-[#8b7355]' : 'text-neutral-500';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
      <div className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl border backdrop-blur-md ${bgClasses} transform transition-all`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors ${subTextClass}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          
          <h2 className={`text-2xl font-bold font-serif ${textClass}`}>
            Promesa del Día
          </h2>

          <div className="min-h-[120px] flex items-center justify-center w-full">
            {loading ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className={`text-sm animate-pulse ${subTextClass}`}>Dios tiene una palabra para ti hoy...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in">
                <p className={`text-lg italic leading-relaxed font-serif ${textClass}`}>
                  "{promise?.text}"
                </p>
                <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm font-semibold text-orange-500 tracking-wide">
                    {promise?.verse}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
          >
            Amén
          </button>
        </div>
      </div>
    </div>
  );
};
