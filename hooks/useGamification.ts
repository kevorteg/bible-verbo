import { useState, useEffect, useCallback } from 'react';
import {
  loadGamification, saveGamification, GamificationData, DEFAULT_GAMIFICATION,
} from '../services/gamificationStorage';
import {
  awardChapterRead, awardBookComplete, checkInDaily, awardTriviaCorrect,
  awardTriviaComplete, canRepairStreak, repairStreak, buyFreeze, buyPotenciador,
  claimDailyReward, checkAchievements, AchievementDef,
  canOpenChest, openChest,
} from '../services/gamificationEngine';
import {
  loadLeagueState, refreshLeagueState, LeagueState, LeagueName,
} from '../services/leagueSystem';

export interface GamificationContext {
  data: GamificationData;
  league: LeagueState | null;
  loading: boolean;
  level: number;
  xpForNext: number;
  xpProgress: number;
  streakMultiplier: number;
  isPotenciadorActive: boolean;
  canRepair: boolean;
  awardChapter: (isFirstToday: boolean) => Promise<{ newAchievements: AchievementDef[]; levelUp: number }>;
  awardBook: (isFirstToday: boolean) => Promise<{ newAchievements: AchievementDef[]; levelUp: number }>;
  awardTriviaCorrectAction: () => Promise<void>;
  awardTriviaCompleteAction: (wasPerfect: boolean) => Promise<void>;
  doCheckIn: () => Promise<void>;
  doRepairStreak: () => Promise<void>;
  doBuyFreeze: () => Promise<void>;
  doBuyPotenciador: () => Promise<void>;
  doClaimDailyReward: () => Promise<{ coins: number; xp: number }>;
  doOpenChest: () => Promise<{ reward: string } | null>;
  canOpenChestNow: boolean;
  refreshLeague: () => Promise<void>;
}

function calcXpForNextLevel(level: number): number {
  return level * level * 100;
}

function getStreakMultiplierValue(streak: number): number {
  if (streak >= 100) return 3;
  if (streak >= 30) return 2;
  if (streak >= 7) return 1.5;
  return 1;
}

export function useGamification(): GamificationContext {
  const [data, setData] = useState<GamificationData>(DEFAULT_GAMIFICATION);
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const loaded = await loadGamification();
      setData(loaded);
      const leagueState = await loadLeagueState(loaded.xp);
      setLeague(leagueState);
      setLoading(false);
    };
    init();
  }, []);

  const level = data.level;
  const xpForNext = calcXpForNextLevel(level);
  const prevLevelXp = (level - 1) * (level - 1) * 100;
  const xpProgress = Math.min((data.xp - prevLevelXp) / ((xpForNext - prevLevelXp) || 1), 1);
  const streakMultiplier = getStreakMultiplierValue(data.streakDays);
  const isPotenciadorActive = data.potenciadorEndTime ? new Date(data.potenciadorEndTime) > new Date() : false;
  const canRepair = canRepairStreak(data);
  const canOpenChestNow = canOpenChest(data);

  const awardChapter = useCallback(async (isFirstToday: boolean) => {
    const result = await awardChapterRead(data, isFirstToday);
    setData({ ...result.data });
    return { newAchievements: result.newAchievements, levelUp: result.levelUp };
  }, [data]);

  const awardBook = useCallback(async (isFirstToday: boolean) => {
    const result = await awardBookComplete(data, isFirstToday);
    setData({ ...result.data });
    return { newAchievements: result.newAchievements, levelUp: result.levelUp };
  }, [data]);

  const awardTriviaCorrectAction = useCallback(async () => {
    const newData = await awardTriviaCorrect(data);
    setData({ ...newData });
  }, [data]);

  const awardTriviaCompleteAction = useCallback(async (wasPerfect: boolean) => {
    const newData = await awardTriviaComplete(data, wasPerfect);
    setData({ ...newData });
  }, [data]);

  const doCheckIn = useCallback(async () => {
    const newData = await checkInDaily(data);
    setData({ ...newData });
  }, [data]);

  const doRepairStreak = useCallback(async () => {
    const newData = await repairStreak(data);
    setData({ ...newData });
  }, [data]);

  const doBuyFreeze = useCallback(async () => {
    const newData = await buyFreeze(data);
    setData({ ...newData });
  }, [data]);

  const doBuyPotenciador = useCallback(async () => {
    const newData = await buyPotenciador(data);
    setData({ ...newData });
  }, [data]);

  const doClaimDailyReward = useCallback(async () => {
    const result = await claimDailyReward(data);
    setData({ ...result.data });
    return result.reward;
  }, [data]);

  const doOpenChest = useCallback(async () => {
    if (!canOpenChest(data)) return null;
    const result = await openChest(data);
    setData({ ...result.data });
    return result;
  }, [data]);

  const refreshLeague = useCallback(async () => {
    const leagueState = await refreshLeagueState(data.xp);
    setLeague(leagueState);
  }, [data.xp]);

  return {
    data, league, loading, level, xpForNext, xpProgress,
    streakMultiplier, isPotenciadorActive, canRepair, canOpenChestNow,
    awardChapter, awardBook, awardTriviaCorrectAction, awardTriviaCompleteAction,
    doCheckIn, doRepairStreak, doBuyFreeze, doBuyPotenciador, doClaimDailyReward, doOpenChest, refreshLeague,
  };
}
