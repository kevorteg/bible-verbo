import { GamificationData, loadGamification, saveGamification } from './gamificationStorage';
import { playXPSound, playAchievementSound } from './audioUtils';

const BASE_XP_CHAPTER = 50;
const BONUS_XP_BOOK_COMPLETE = 500;
const XP_PER_TRIVIA_CORRECT = 30;
const XP_PER_STREAK_DAY = 10;
const COINS_PER_CHAPTER = 10;
const COINS_PER_STREAK_7 = 50;
const COINS_PER_TRIVIA = 20;
const STREAK_MULTIPLIER_7 = 1.5;
const STREAK_MULTIPLIER_30 = 2;
const STREAK_MULTIPLIER_100 = 3;
const COMBO_MULTIPLIER = 1.5;

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 100) return STREAK_MULTIPLIER_100;
  if (streak >= 30) return STREAK_MULTIPLIER_30;
  if (streak >= 7) return STREAK_MULTIPLIER_7;
  return 1;
}

function hasCombo(data: GamificationData): boolean {
  if (!data.lastComboDate) return false;
  const now = new Date();
  const lastCombo = new Date(data.lastComboDate);
  const hoursDiff = (now.getTime() - lastCombo.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 6;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  condition: (data: GamificationData) => boolean;
  coinReward: number;
  hidden?: boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_chapter', title: 'Principiante', description: 'Leer 1er capitulo', condition: d => d.chaptersRead >= 1, coinReward: 50 },
  { id: 'streak_7', title: 'Racha de 7', description: '7 dias seguidos', condition: d => d.maxStreak >= 7, coinReward: 100 },
  { id: 'streak_30', title: 'Racha de 30', description: '30 dias seguidos', condition: d => d.maxStreak >= 30, coinReward: 500 },
  { id: 'streak_100', title: 'Racha de 100', description: '100 dias seguidos', condition: d => d.maxStreak >= 100, coinReward: 2000 },
  { id: 'chapters_10', title: 'Escribe', description: '10 capitulos leidos', condition: d => d.chaptersRead >= 10, coinReward: 100 },
  { id: 'chapters_50', title: 'Estudiante', description: '50 capitulos leidos', condition: d => d.chaptersRead >= 50, coinReward: 300 },
  { id: 'chapters_100', title: 'Teologo', description: '100 capitulos leidos', condition: d => d.chaptersRead >= 100, coinReward: 500 },
  { id: 'chapters_500', title: 'Sabio', description: '500 capitulos leidos', condition: d => d.chaptersRead >= 500, coinReward: 2000 },
  { id: 'trivias_10_perfect', title: 'Trivia Maestro', description: '10 trivias perfectas', condition: d => d.triviasPerfect >= 10, coinReward: 300 },
  { id: 'book_complete', title: 'Libro Completo', description: '1 libro completado', condition: d => d.booksCompleted >= 1, coinReward: 200 },
  { id: 'level_5', title: 'Nivel 5', description: 'Alcanzar nivel 5', condition: d => calcLevel(d.xp) >= 5, coinReward: 150 },
  { id: 'level_10', title: 'Nivel 10', description: 'Alcanzar nivel 10', condition: d => calcLevel(d.xp) >= 10, coinReward: 400 },
  { id: 'level_25', title: 'Nivel 25', description: 'Alcanzar nivel 25', condition: d => calcLevel(d.xp) >= 25, coinReward: 1000 },
  { id: 'level_50', title: 'Nivel 50', description: 'Alcanzar nivel 50', condition: d => calcLevel(d.xp) >= 50, coinReward: 3000 },
  { id: 'intercesor_25', title: 'Intercesor', description: 'Orear por 25 personas', condition: d => d.prayersForOthers >= 25, coinReward: 150, hidden: true },
  { id: 'intercesor_100', title: 'Intercesor Fiel', description: 'Orear por 100 personas', condition: d => d.prayersForOthers >= 100, coinReward: 500, hidden: true },
  { id: 'madrugador_7', title: 'Madrugador', description: 'Leer 7 veces antes de las 6 AM', condition: d => d.earlyReadings >= 7, coinReward: 100, hidden: true },
  { id: 'madrugador_30', title: 'Lucero del Alba', description: 'Leer 30 veces antes de las 6 AM', condition: d => d.earlyReadings >= 30, coinReward: 400, hidden: true },
  { id: 'compartido_10', title: 'Evangelista', description: 'Compartir 10 versiculos', condition: d => d.versesShared >= 10, coinReward: 100, hidden: true },
  { id: 'compartido_50', title: 'Predicador', description: 'Compartir 50 versiculos', condition: d => d.versesShared >= 50, coinReward: 400, hidden: true },
  { id: 'cofre_abierto', title: 'Cofre de Bendicion', description: 'Abrir tu primer cofre', condition: d => d.achievements.includes('cofre_abierto'), coinReward: 100, hidden: true },
];

export function checkAchievements(data: GamificationData): { newAchievements: AchievementDef[]; totalCoinReward: number } {
  const newAchievements: AchievementDef[] = [];
  let totalCoinReward = 0;
  for (const ach of ACHIEVEMENTS) {
    if (!data.achievements.includes(ach.id) && ach.condition(data)) {
      newAchievements.push(ach);
      totalCoinReward += ach.coinReward;
    }
  }
  return { newAchievements, totalCoinReward };
}

export async function awardChapterRead(data: GamificationData, isFirstToday: boolean): Promise<{ data: GamificationData; newAchievements: AchievementDef[]; levelUp: number }> {
  let multiplier = getStreakMultiplier(data.streakDays);
  if (hasCombo(data)) multiplier *= COMBO_MULTIPLIER;
  if (data.potenciadorEndTime && new Date(data.potenciadorEndTime) > new Date()) multiplier *= 2;

  let xpGain = Math.round(BASE_XP_CHAPTER * multiplier);
  if (isFirstToday) xpGain *= 2;

  data.xp += xpGain;
  data.coins += COINS_PER_CHAPTER;
  data.chaptersRead += 1;

  const newLevel = calcLevel(data.xp);
  const levelUp = newLevel > data.level ? newLevel - data.level : 0;
  data.level = newLevel;

  data.comboCount = hasCombo(data) ? data.comboCount + 1 : 1;
  data.lastComboDate = new Date().toISOString();

  const { newAchievements, totalCoinReward } = checkAchievements(data);
  if (newAchievements.length > 0) {
    for (const ach of newAchievements) {
      data.achievements.push(ach.id);
      data.coins += ach.coinReward;
      playAchievementSound();
    }
  }

  await saveGamification(data);
  playXPSound().catch(() => {});
  return { data, newAchievements, levelUp };
}

export async function awardBookComplete(data: GamificationData, isFirstToday: boolean): Promise<{ data: GamificationData; newAchievements: AchievementDef[]; levelUp: number }> {
  let multiplier = getStreakMultiplier(data.streakDays);
  if (hasCombo(data)) multiplier *= COMBO_MULTIPLIER;
  if (data.potenciadorEndTime && new Date(data.potenciadorEndTime) > new Date()) multiplier *= 2;

  let xpGain = Math.round(BONUS_XP_BOOK_COMPLETE * multiplier);
  if (isFirstToday) xpGain *= 2;

  data.xp += xpGain;
  data.coins += 100;
  data.booksCompleted += 1;

  const newLevel = calcLevel(data.xp);
  const levelUp = newLevel > data.level ? newLevel - data.level : 0;
  data.level = newLevel;

  const { newAchievements, totalCoinReward } = checkAchievements(data);
  if (newAchievements.length > 0) {
    for (const ach of newAchievements) {
      data.achievements.push(ach.id);
      data.coins += ach.coinReward;
      playAchievementSound();
    }
  }

  await saveGamification(data);
  playXPSound().catch(() => {});
  return { data, newAchievements, levelUp };
}

export async function checkInDaily(data: GamificationData): Promise<GamificationData> {
  const today = new Date().toISOString().split('T')[0];
  if (data.lastActivityDate === today) return data;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.freezeItems > 0) {
    data.freezeItems -= 1;
    data.streakDays += 1;
  } else if (data.lastActivityDate === yesterdayStr) {
    data.streakDays += 1;
    data.xp += Math.round(XP_PER_STREAK_DAY * getStreakMultiplier(data.streakDays));
  } else {
    data.streakDays = 1;
  }

  data.maxStreak = Math.max(data.maxStreak, data.streakDays);
  data.lastActivityDate = today;
  data.comboCount = 0;
  data.dailyRewardClaimed = false;

  if (data.streakDays === 7) data.coins += COINS_PER_STREAK_7;
  if (data.streakDays % 30 === 0) data.coins += 200;

  const newLevel = calcLevel(data.xp);
  data.level = newLevel;

  const { newAchievements, totalCoinReward } = checkAchievements(data);
  if (newAchievements.length > 0) {
    for (const ach of newAchievements) {
      data.achievements.push(ach.id);
      data.coins += ach.coinReward;
    }
  }

  await saveGamification(data);
  return data;
}

export async function awardTriviaCorrect(data: GamificationData): Promise<GamificationData> {
  data.xp += XP_PER_TRIVIA_CORRECT;
  data.coins += 5;
  const newLevel = calcLevel(data.xp);
  data.level = newLevel;
  await saveGamification(data);
  return data;
}

export async function awardTriviaComplete(data: GamificationData, wasPerfect: boolean): Promise<GamificationData> {
  data.triviasCompleted += 1;
  data.coins += COINS_PER_TRIVIA;
  if (wasPerfect) data.triviasPerfect += 1;
  const { newAchievements, totalCoinReward } = checkAchievements(data);
  if (newAchievements.length > 0) {
    for (const ach of newAchievements) {
      data.achievements.push(ach.id);
      data.coins += ach.coinReward;
    }
  }
  await saveGamification(data);
  return data;
}

export function canRepairStreak(data: GamificationData): boolean {
  return data.coins >= 500 && !data.repairUsedThisMonth;
}

export async function repairStreak(data: GamificationData): Promise<GamificationData> {
  if (!canRepairStreak(data)) return data;
  data.coins -= 500;
  data.repairUsedThisMonth = true;
  data.streakDays = Math.max(data.streakDays, 1);
  await saveGamification(data);
  return data;
}

export async function buyFreeze(data: GamificationData): Promise<GamificationData> {
  if (data.coins < 200) return data;
  data.coins -= 200;
  data.inventory.freeze += 1;
  await saveGamification(data);
  return data;
}

export async function buyPotenciador(data: GamificationData): Promise<GamificationData> {
  if (data.coins < 100) return data;
  data.coins -= 100;
  data.inventory.potenciador += 1;
  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + 30);
  data.potenciadorEndTime = endTime.toISOString();
  await saveGamification(data);
  return data;
}

export function canOpenChest(data: GamificationData): boolean {
  if (data.streakDays < 7) return false;
  if (!data.chestOpenedAt) return true;
  const lastOpen = new Date(data.chestOpenedAt);
  const now = new Date();
  const daysSinceOpen = Math.floor((now.getTime() - lastOpen.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceOpen >= 7;
}

const CHEST_REWARDS = [
  { coins: 100, xp: 50, label: '100 monedas y 50 XP' },
  { coins: 150, xp: 30, label: '150 monedas y 30 XP' },
  { coins: 50, xp: 100, label: '50 monedas y 100 XP' },
  { coins: 200, xp: 20, label: '200 monedas y 20 XP' },
  { coins: 0, xp: 0, label: '1 Congelar Racha', freeze: 1 },
  { coins: 0, xp: 0, label: '1 Potenciador x2', potenciador: 1 },
];

export async function openChest(data: GamificationData): Promise<{ data: GamificationData; reward: string }> {
  const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];
  data.coins += reward.coins || 0;
  data.xp += reward.xp || 0;
  if (reward.freeze) data.inventory.freeze += reward.freeze;
  if (reward.potenciador) data.inventory.potenciador += reward.potenciador;
  data.chestOpenedAt = new Date().toISOString();
  if (!data.achievements.includes('cofre_abierto')) {
    data.achievements.push('cofre_abierto');
    data.coins += 100;
  }
  const newLevel = calcLevel(data.xp);
  data.level = newLevel;
  await saveGamification(data);
  return { data, reward: reward.label };
}

export async function claimDailyReward(data: GamificationData): Promise<{ data: GamificationData; reward: { coins: number; xp: number } }> {
  const today = new Date().toISOString().split('T')[0];
  if (data.dailyRewardClaimed && data.lastDailyRewardDate === today) {
    return { data, reward: { coins: 0, xp: 0 } };
  }

  const streakBonus = Math.min(data.streakDays, 30);
  const coins = 20 + streakBonus * 2;
  const xp = 30 + streakBonus;

  data.coins += coins;
  data.xp += xp;
  data.dailyRewardClaimed = true;
  data.lastDailyRewardDate = today;

  const newLevel = calcLevel(data.xp);
  data.level = newLevel;

  await saveGamification(data);
  return { data, reward: { coins, xp } };
}
