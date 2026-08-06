import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReaderBg = 'cream' | 'dark' | 'sepia' | 'paper';
export type ReaderFont = 'PlusJakartaSans' | 'BricolageGrotesque' | 'SpaceGrotesk' | 'serif' | 'mono';

export interface ReaderSettings {
  bg: ReaderBg;
  fontSize: number;
  lineHeight: number;
  font: ReaderFont;
  verseSpacing: number;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  bg: 'cream',
  fontSize: 16,
  lineHeight: 1.6,
  font: 'PlusJakartaSans',
  verseSpacing: 12,
};

const STORAGE_KEY = 'verbo_reader_settings';

export const BG_COLORS: Record<ReaderBg, { bg: string; surface: string; text: string; label: string }> = {
  cream: { bg: '#FFF5F0', surface: '#FFFFFF', text: '#231914', label: 'Crema' },
  dark: { bg: '#1A1A2E', surface: '#16213E', text: '#E0E0E0', label: 'Oscuro' },
  sepia: { bg: '#F4ECD8', surface: '#FAF1E6', text: '#3E2C1A', label: 'Sepia' },
  paper: { bg: '#F5F0E8', surface: '#FCF9F2', text: '#2C2416', label: 'Papel' },
};

export async function loadReaderSettings(): Promise<ReaderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function saveReaderSettings(settings: ReaderSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
