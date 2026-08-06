import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'verbo_favorites';

export interface FavoriteVerse {
  id: string;
  bookName: string;
  chapterNum: string;
  verseNum: string;
  text: string;
  createdAt: string;
}

export async function getFavorites(): Promise<FavoriteVerse[]> {
  try {
    const saved = await AsyncStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(verse: FavoriteVerse): Promise<void> {
  const favorites = await getFavorites();
  const exists = favorites.some(f => f.id === verse.id);
  if (!exists) {
    favorites.unshift(verse);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export async function removeFavorite(verseId: string): Promise<void> {
  const favorites = await getFavorites();
  const filtered = favorites.filter(f => f.id !== verseId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export async function isFavorite(verseId: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.id === verseId);
}
