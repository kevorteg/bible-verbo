import AsyncStorage from '@react-native-async-storage/async-storage';
import seedData from '../data/churches.json';

const CACHE_KEY = 'verbo_churches_cache';
const CACHE_TIMESTAMP_KEY = 'verbo_churches_cache_ts';
const BLOB_URL = 'https://kd3dyljmdmmgmsyw.public.blob.vercel-storage.com/data/churches.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface Church {
  id: string;
  name: string;
  address: string;
  city: string;
  department: string;
  lat: number;
  lng: number;
  phone?: string;
  schedule: string;
  pastor: string;
  type: 'IPUC' | 'IPUIC';
}

interface ChurchesData {
  updatedAt: string;
  churches: Church[];
}

function getChurchesFromSeed(): Church[] {
  return seedData.churches;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function getNearestChurches(
  userLat: number,
  userLng: number,
  churches: Church[],
  limit: number = 20,
): (Church & { distanceKm: number; distanceLabel: string })[] {
  return churches
    .map(c => {
      const d = getDistanceKm(userLat, userLng, c.lat, c.lng);
      return { ...c, distanceKm: d, distanceLabel: formatDistance(d) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function loadChurches(): Promise<Church[]> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (cached && timestamp) {
      const age = now - parseInt(timestamp, 10);
      if (age < CACHE_TTL_MS) {
        const parsed: ChurchesData = JSON.parse(cached);
        if (parsed.churches && parsed.churches.length > 0) {
          return parsed.churches;
        }
      }
    }

    const fresh = await fetchFromBlob();
    if (fresh && fresh.churches.length > 0) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(now));
      return fresh.churches;
    }

    if (cached) {
      const parsed: ChurchesData = JSON.parse(cached);
      if (parsed.churches && parsed.churches.length > 0) {
        return parsed.churches;
      }
    }

    return getChurchesFromSeed();
  } catch {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: ChurchesData = JSON.parse(cached);
        return parsed.churches;
      }
    } catch {}
    return getChurchesFromSeed();
  }
}

async function fetchFromBlob(): Promise<ChurchesData | null> {
  try {
    const res = await fetch(BLOB_URL, { method: 'GET' });
    if (!res.ok) return null;
    const data: ChurchesData = await res.json();
    return data;
  } catch {
    return null;
  }
}
