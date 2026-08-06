import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

export interface TriviaScore {
  title: string;
  score: number;
  total: number;
  date: string;
}

const STORAGE_KEY = 'verbo_trivia_scores';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
}

export async function saveTriviaScore(title: string, score: number, total: number): Promise<void> {
  const date = new Date().toISOString();
  const userId = await getCurrentUserId();

  const entry: TriviaScore = { title, score, total, date };

  if (userId) {
    try {
      await supabase.from('quiz_results').insert({
        user_id: userId,
        score,
        total_questions: total,
        topic: title,
        completed_at: date,
      });
    } catch {
      // fall through to local storage
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const scores = raw ? JSON.parse(raw) : [];
    scores.unshift(entry);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 20)));
  } catch {}
}

export async function getRecentScores(limit = 5): Promise<TriviaScore[]> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const { data } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (data && data.length > 0) {
        return data.map(r => ({
          title: r.topic || 'Trivia',
          score: r.score,
          total: r.total_questions,
          date: r.completed_at,
        }));
      }
    } catch {
      // fall through
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const scores: TriviaScore[] = JSON.parse(raw);
      return scores.slice(0, limit);
    }
  } catch {}
  return [];
}

export async function getScoreStats(): Promise<{ total: number; avgScore: number; bestScore: number }> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const { data } = await supabase
        .from('quiz_results')
        .select('score, total_questions')
        .eq('user_id', userId);

      if (data && data.length > 0) {
        const total = data.length;
        const avgScore = data.reduce((sum, r) => sum + (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0), 0) / total;
        const bestScore = Math.max(...data.map(r => r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0));
        return { total, avgScore: Math.round(avgScore), bestScore };
      }
    } catch {
      // fall through
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const scores: TriviaScore[] = JSON.parse(raw);
      if (scores.length === 0) return { total: 0, avgScore: 0, bestScore: 0 };
      const total = scores.length;
      const avgScore = scores.reduce((sum, s) => sum + (s.total > 0 ? (s.score / s.total) * 100 : 0), 0) / total;
      const bestScore = Math.max(...scores.map(s => s.total > 0 ? Math.round((s.score / s.total) * 100) : 0));
      return { total, avgScore: Math.round(avgScore), bestScore };
    }
  } catch {}
  return { total: 0, avgScore: 0, bestScore: 0 };
}
