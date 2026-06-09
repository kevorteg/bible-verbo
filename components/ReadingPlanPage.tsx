import React, { useState, useCallback } from 'react';
import { BookOpen, Zap, Heart, Star, CheckCircle, Circle, ArrowLeft, Calendar, RotateCcw } from 'lucide-react';
import { READING_PLANS, ReadingPlan } from '../data/readingPlans';

interface ReadingPlanPageProps {
  onNavigateToChapter: (bookId: string, chapterNum: number) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'verbo_reading_progress';

interface PlanProgress {
  planId: string;
  completedDays: number[];
  startDate: string;
}

function loadProgress(): Record<string, PlanProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(progress: Record<string, PlanProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const ICONS: Record<string, React.ElementType> = { zap: Zap, heart: Heart, book: BookOpen, star: Star };

function PlanDetail({
  plan,
  progress,
  onNavigate,
  onBack,
}: {
  plan: ReadingPlan;
  progress: PlanProgress;
  onNavigate: (bookId: string, chapter: number) => void;
  onBack: () => void;
}) {
  const [todayDay] = useState(() => Math.min(
    Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    plan.durationDays
  ));

  const completedSet = new Set(progress.completedDays);
  const totalDone = progress.completedDays.length;
  const pct = Math.round((totalDone / plan.durationDays) * 100);

  const handleToggleDay = useCallback((day: number) => {
    const stored = loadProgress();
    const current = stored[plan.id] || { ...progress };
    const set = new Set(current.completedDays);
    if (set.has(day)) set.delete(day); else set.add(day);
    stored[plan.id] = { ...current, completedDays: [...set].sort((a, b) => a - b) };
    saveProgress(stored);
  }, [plan.id, progress]);

  const handleReset = () => {
    const stored = loadProgress();
    delete stored[plan.id];
    saveProgress(stored);
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={18} /> Planes
      </button>

      <div className="bg-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-black text-white">{plan.name}</h2>
        <p className="text-neutral-400 mt-2 text-sm">{plan.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-neutral-300">
          <span className="flex items-center gap-1"><Calendar size={14} /> {plan.durationDays} días</span>
          <span className="flex items-center gap-1"><CheckCircle size={14} /> {totalDone} completados</span>
        </div>
        <div className="mt-3 w-full bg-white/10 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-neutral-500 mt-1 block">{pct}% completo</span>
      </div>

      <div className="space-y-1">
        {plan.days.map((day) => {
          const isToday = day.day === todayDay;
          const isDone = completedSet.has(day.day);
          return (
            <div
              key={day.day}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isToday ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-white/5'
              } ${isDone ? 'opacity-60' : ''}`}
            >
              <button onClick={() => handleToggleDay(day.day)} className="shrink-0">
                {isDone ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} className="text-neutral-500" />}
              </button>
              <button
                onClick={() => onNavigate(day.bookId, day.chapter)}
                className="flex-1 text-left"
              >
                <span className="text-sm font-bold text-neutral-300">{day.day}. </span>
                <span className="text-sm text-white font-medium">{day.title || `${day.bookId} ${day.chapter}${day.endChapter ? `-${day.endChapter}` : ''}`}</span>
              </button>
              {isToday && !isDone && <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-500/20 px-2 py-1 rounded-full">Hoy</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button onClick={handleReset} className="text-neutral-500 hover:text-red-400 text-xs flex items-center gap-1 mx-auto transition-colors">
          <RotateCcw size={12} /> Reiniciar progreso
        </button>
      </div>
    </div>
  );
}

export const ReadingPlanPage: React.FC<ReadingPlanPageProps> = ({ onNavigateToChapter, onBack }) => {
  const [progress, setProgress] = useState<Record<string, PlanProgress>>(loadProgress);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  if (selectedPlan) {
    const plan = READING_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return null;
    const prog = progress[plan.id] || { planId: plan.id, completedDays: [], startDate: new Date().toISOString() };
    return (
      <PlanDetail
        plan={plan}
        progress={prog}
        onNavigate={onNavigateToChapter}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={18} /> Volver
      </button>

      <h2 className="text-2xl font-black text-white mb-2">Planes de Lectura</h2>
      <p className="text-neutral-400 text-sm mb-6">Elige un plan y lee la Biblia con propósito</p>

      <div className="grid gap-4">
        {READING_PLANS.map((plan) => {
          const prog = progress[plan.id];
          const pct = prog ? Math.round((prog.completedDays.length / plan.durationDays) * 100) : 0;
          const Icon = ICONS[plan.icon] || BookOpen;

          return (
            <button
              key={plan.id}
              onClick={() => {
                if (!prog) {
                  const stored = { ...progress, [plan.id]: { planId: plan.id, completedDays: [], startDate: new Date().toISOString() } };
                  setProgress(stored);
                  saveProgress(stored);
                }
                setSelectedPlan(plan.id);
              }}
              className="bg-white/5 hover:bg-white/10 rounded-2xl p-5 text-left transition-all border border-white/10 hover:border-orange-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl shrink-0">
                  <Icon size={24} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{plan.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    <span>{plan.durationDays} días</span>
                    {pct > 0 && <span className="text-orange-500">{pct}% completo</span>}
                  </div>
                  {pct > 0 && (
                    <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
