import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GamificationData {
  xp: number;
  level: number;
  coins: number;
  streakDays: number;
  maxStreak: number;
  lastActivityDate: string | null;
  freezeItems: number;
  repairUsedThisMonth: boolean;
  chaptersRead: number;
  booksCompleted: number;
  triviasPerfect: number;
  triviasCompleted: number;
  dailyRewardClaimed: boolean;
  lastDailyRewardDate: string | null;
  comboCount: number;
  lastComboDate: string | null;
  potenciadorEndTime: string | null;
  achievements: string[];
  inventory: { freeze: number; repair: number; potenciador: number };
  prayersForOthers: number;
  prayersCreated: number;
  versesShared: number;
  earlyReadings: number;
  chestOpenedAt: string | null;
}

export const DEFAULT_GAMIFICATION: GamificationData = {
  xp: 0,
  level: 1,
  coins: 0,
  streakDays: 0,
  maxStreak: 0,
  lastActivityDate: null,
  freezeItems: 0,
  repairUsedThisMonth: false,
  chaptersRead: 0,
  booksCompleted: 0,
  triviasPerfect: 0,
  triviasCompleted: 0,
  dailyRewardClaimed: false,
  lastDailyRewardDate: null,
  comboCount: 0,
  lastComboDate: null,
  potenciadorEndTime: null,
  achievements: [],
  inventory: { freeze: 0, repair: 0, potenciador: 0 },
  prayersForOthers: 0,
  prayersCreated: 0,
  versesShared: 0,
  earlyReadings: 0,
  chestOpenedAt: null,
};

const STORAGE_KEY = 'verbo_gamification';

export async function loadGamification(): Promise<GamificationData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GAMIFICATION, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_GAMIFICATION };
}

export async function saveGamification(data: GamificationData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function resetGamification(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
