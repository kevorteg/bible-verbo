import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { getMyGroup } from './groupService';

export interface Challenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  targetChapters: number;
  currentChapters: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface ChallengeContribution {
  userName: string;
  chapters: number;
  isMe?: boolean;
}

const STORAGE_KEY = 'verbo_challenges';
const CONTRIBUTION_KEY = 'verbo_challenge_contributions';

type LocalContributions = Record<string, Record<string, number>>;

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
}

async function getMyDisplayName(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.user_metadata?.full_name || data.session?.user?.email?.split('@')[0] || 'Miembro';
  } catch {
    return 'Miembro';
  }
}

interface ChallengeRow {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  target_chapters: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
}

function mapChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    description: row.description || '',
    targetChapters: row.target_chapters,
    currentChapters: 0,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active,
    createdAt: row.created_at,
  };
}

async function getAllLocal(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function getLocalContributions(): Promise<LocalContributions> {
  try {
    const raw = await AsyncStorage.getItem(CONTRIBUTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const group = await getMyGroup();
      if (group && !group.id.startsWith('group_')) {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('group_challenges')
          .select('*')
          .eq('group_id', group.id)
          .eq('active', true)
          .gte('end_date', today)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const challenges = data.map(mapChallenge);
          for (const c of challenges) {
            const { data: contribs } = await supabase
              .from('challenge_contributions')
              .select('chapters_contributed')
              .eq('challenge_id', c.id);
            c.currentChapters = (contribs || []).reduce((sum, r) => sum + (r.chapters_contributed || 0), 0);
          }
          return challenges;
        }
      }
    } catch {}
  }
  const all = await getAllLocal();
  const contribs = await getLocalContributions();
  const today = new Date().toISOString().split('T')[0];
  return all
    .filter(c => c.active && c.endDate >= today)
    .map(c => ({ ...c, currentChapters: Object.values(contribs[c.id] || {}).reduce((sum, n) => sum + n, 0) }));
}

export async function createChallenge(input: { title: string; description: string; targetChapters: number; endDate: string }): Promise<Challenge> {
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const group = await getMyGroup();
      if (group && !group.id.startsWith('group_')) {
        const { data, error } = await supabase
          .from('group_challenges')
          .insert({
            group_id: group.id,
            title: input.title,
            description: input.description || '',
            target_chapters: input.targetChapters,
            start_date: new Date().toISOString().split('T')[0],
            end_date: input.endDate,
            created_by: userId,
          })
          .select()
          .single();
        if (!error && data) return mapChallenge(data);
      }
    } catch {}
  }
  const challenge: Challenge = {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    groupId: 'local',
    title: input.title,
    description: input.description || '',
    targetChapters: input.targetChapters,
    currentChapters: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: input.endDate,
    active: true,
    createdAt: new Date().toISOString(),
  };
  const all = await getAllLocal();
  all.push(challenge);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return challenge;
}

export async function contributeToActiveChallenges(): Promise<void> {
  const userName = await getMyDisplayName();
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const group = await getMyGroup();
      if (group && !group.id.startsWith('group_')) {
        const { data: challenges } = await supabase
          .from('group_challenges')
          .select('*')
          .eq('group_id', group.id)
          .eq('active', true);
        for (const c of challenges || []) {
          const { data: existing } = await supabase
            .from('challenge_contributions')
            .select('*')
            .eq('challenge_id', c.id)
            .eq('user_id', userId)
            .maybeSingle();
          if (existing) {
            await supabase
              .from('challenge_contributions')
              .update({ chapters_contributed: (existing.chapters_contributed || 0) + 1, last_contributed_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('challenge_contributions')
              .insert({ challenge_id: c.id, user_id: userId, user_name: userName, chapters_contributed: 1, last_contributed_at: new Date().toISOString() });
          }
          const { data: sum } = await supabase
            .from('challenge_contributions')
            .select('chapters_contributed')
            .eq('challenge_id', c.id);
          const total = (sum || []).reduce((acc, r) => acc + (r.chapters_contributed || 0), 0);
          if (total >= c.target_chapters) {
            await supabase.from('group_challenges').update({ active: false }).eq('id', c.id);
          }
        }
        return;
      }
    } catch {}
  }
  await contributeLocal(userName);
}

async function contributeLocal(userName: string): Promise<void> {
  const all = await getAllLocal();
  const active = all.filter(c => c.active && c.endDate >= new Date().toISOString().split('T')[0]);
  if (active.length === 0) return;
  const contribs = await getLocalContributions();
  for (const c of active) {
    contribs[c.id] = contribs[c.id] || {};
    contribs[c.id][userName] = (contribs[c.id][userName] || 0) + 1;
  }
  await AsyncStorage.setItem(CONTRIBUTION_KEY, JSON.stringify(contribs));
  for (const c of all) {
    if (c.id in contribs) {
      c.currentChapters = Object.values(contribs[c.id]).reduce((sum, n) => sum + n, 0);
    }
    if (c.active && c.currentChapters >= c.targetChapters) c.active = false;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function getChallengeLeaderboard(challengeId: string, currentUserName?: string): Promise<ChallengeContribution[]> {
  const userId = await getCurrentUserId();
  if (userId) {
    try {
      const { data } = await supabase
        .from('challenge_contributions')
        .select('*')
        .eq('challenge_id', challengeId);
      if (data && data.length > 0) {
        const map: Record<string, number> = {};
        for (const r of data) {
          const name = r.user_name || 'Miembro';
          map[name] = (map[name] || 0) + (r.chapters_contributed || 0);
        }
        return Object.entries(map)
          .map(([userName, chapters]) => ({ userName, chapters, isMe: currentUserName ? userName === currentUserName : false }))
          .sort((a, b) => b.chapters - a.chapters);
      }
    } catch {}
  }
  const contribs = await getLocalContributions();
  const map = contribs[challengeId] || {};
  return Object.entries(map)
    .map(([userName, chapters]) => ({ userName, chapters, isMe: currentUserName ? userName === currentUserName : false }))
    .sort((a, b) => b.chapters - a.chapters);
}

export async function getCurrentChallengeUserName(): Promise<string> {
  return getMyDisplayName();
}
