import AsyncStorage from '@react-native-async-storage/async-storage';
import seedData from '../data/sermons.json';
import { supabase } from './supabaseClient';

const CACHE_KEY = 'verbo_sermons_cache';
const CACHE_TIMESTAMP_KEY = 'verbo_sermons_cache_ts';
const BLOB_URL = 'https://kd3dyljmdmmgmsyw.public.blob.vercel-storage.com/data/sermons.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  category: string;
  youtubeId: string;
  description: string;
  verse?: string;
  views?: number;
}

interface SermonsData {
  updatedAt: string;
  sermons: Sermon[];
}

interface SupabaseSermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  category: string;
  youtube_id: string;
  description: string;
  verse: string | null;
  views: number | null;
  thumbnail: string | null;
}

function getThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

function getYoutubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
}

function getYoutubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

function mapSupabaseToSermon(row: SupabaseSermon): Sermon {
  return {
    id: row.id,
    title: row.title,
    preacher: row.preacher,
    date: row.date,
    duration: row.duration,
    category: row.category,
    youtubeId: row.youtube_id,
    description: row.description,
    verse: row.verse || undefined,
    views: row.views || undefined,
  };
}

function getSermonsFromSeed(): Sermon[] {
  return seedData.sermons;
}

export function getThumbnail(sermon: Sermon): string {
  return getThumbnailUrl(sermon.youtubeId);
}

export function getEmbedUrl(sermon: Sermon): string {
  return getYoutubeEmbedUrl(sermon.youtubeId);
}

export function getWatchUrl(sermon: Sermon): string {
  return getYoutubeWatchUrl(sermon.youtubeId);
}

export async function loadSermons(): Promise<Sermon[]> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (cached && timestamp) {
      const age = now - parseInt(timestamp, 10);
      if (age < CACHE_TTL_MS) {
        const parsed: SermonsData = JSON.parse(cached);
        if (parsed.sermons && parsed.sermons.length > 0) {
          return parsed.sermons;
        }
      }
    }

    const fromSupabase = await fetchFromSupabase();
    if (fromSupabase && fromSupabase.length > 0) {
      const data: SermonsData = { updatedAt: new Date().toISOString(), sermons: fromSupabase };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(now));
      return fromSupabase;
    }

    const fromBlob = await fetchFromBlob();
    if (fromBlob && fromBlob.sermons.length > 0) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fromBlob));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(now));
      return fromBlob.sermons;
    }

    if (cached) {
      const parsed: SermonsData = JSON.parse(cached);
      if (parsed.sermons && parsed.sermons.length > 0) {
        return parsed.sermons;
      }
    }

    return getSermonsFromSeed();
  } catch {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: SermonsData = JSON.parse(cached);
        return parsed.sermons;
      }
    } catch {}
    return getSermonsFromSeed();
  }
}

export async function refreshSermons(): Promise<Sermon[]> {
  try {
    const fromSupabase = await fetchFromSupabase();
    if (fromSupabase && fromSupabase.length > 0) {
      const data: SermonsData = { updatedAt: new Date().toISOString(), sermons: fromSupabase };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
      return fromSupabase;
    }
  } catch {}
  return loadSermons();
}

async function fetchFromSupabase(): Promise<Sermon[] | null> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(mapSupabaseToSermon);
  } catch {
    return null;
  }
}

async function fetchFromBlob(): Promise<SermonsData | null> {
  try {
    const res = await fetch(BLOB_URL, { method: 'GET' });
    if (!res.ok) return null;
    const data: SermonsData = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function seedSermonsToSupabase(): Promise<void> {
  const existing = await fetchFromSupabase();
  if (existing && existing.length > 0) return;

  const seed = getSermonsFromSeed();
  const rows = seed.map(s => ({
    title: s.title,
    preacher: s.preacher,
    date: s.date,
    duration: s.duration,
    category: s.category,
    youtube_id: s.youtubeId,
    description: s.description,
    verse: s.verse || null,
    views: s.views || 0,
    thumbnail: getThumbnailUrl(s.youtubeId),
  }));

  const { error } = await supabase.from('sermons').insert(rows);
  if (error) throw error;
}
