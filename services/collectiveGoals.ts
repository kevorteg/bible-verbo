import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Milestone {
  chapters: number;
  label: string;
  rewardCoins: number;
  rewardXp: number;
}

export interface CollectiveGoal {
  id: string;
  title: string;
  description: string;
  targetChapters: number;
  currentChapters: number;
  milestones: Milestone[];
  reachedMilestones: number[];
  startDate: string;
  endDate: string;
  createdAt: string;
  active: boolean;
}

const STORAGE_KEY = 'verbo_collective_goals';

export async function getActiveGoals(): Promise<CollectiveGoal[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const all: CollectiveGoal[] = JSON.parse(raw);
      return all.filter(g => g.active);
    }
  } catch {}
  return [];
}

export async function getAllGoals(): Promise<CollectiveGoal[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function createGoal(goal: Omit<CollectiveGoal, 'id' | 'currentChapters' | 'reachedMilestones' | 'active' | 'createdAt'>): Promise<CollectiveGoal> {
  const newGoal: CollectiveGoal = {
    ...goal,
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    currentChapters: 0,
    reachedMilestones: [],
    active: true,
    createdAt: new Date().toISOString(),
  };
  const all = await getAllGoals();
  all.push(newGoal);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newGoal;
}

export interface ContributionResult {
  newMilestones: Milestone[];
  goalCompleted: boolean;
}

export async function contributeToGoal(goalId: string, chapters = 1): Promise<ContributionResult> {
  const all = await getAllGoals();
  const idx = all.findIndex(g => g.id === goalId);
  if (idx === -1) return { newMilestones: [], goalCompleted: false };

  const goal = all[idx];
  goal.currentChapters += chapters;

  const newMilestones: Milestone[] = [];
  for (const m of goal.milestones) {
    if (!goal.reachedMilestones.includes(m.chapters) && goal.currentChapters >= m.chapters) {
      goal.reachedMilestones.push(m.chapters);
      newMilestones.push(m);
    }
  }

  const goalCompleted = goal.currentChapters >= goal.targetChapters;
  if (goalCompleted) {
    goal.active = false;
  }

  all[idx] = goal;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return { newMilestones, goalCompleted };
}

const GOAL_CONTRIBUTION_KEY = 'verbo_goal_contributions';

export async function getGoalContributions(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_CONTRIBUTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export async function addContribution(goalId: string, chapters: number): Promise<void> {
  const contribs = await getGoalContributions();
  contribs[goalId] = (contribs[goalId] || 0) + chapters;
  await AsyncStorage.setItem(GOAL_CONTRIBUTION_KEY, JSON.stringify(contribs));
}
