import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

export interface GroupMember {
  id: string;
  name: string;
  chaptersRead: number;
  lastRead: string | null;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  code: string;
  members: GroupMember[];
  createdAt: string;
}

const STORAGE_KEY = 'verbo_groups';
const GROUP_READING_KEY = 'verbo_group_reading_log';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
}

async function getGroupFromSupabase(userId: string): Promise<Group | null> {
  try {
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) return null;

    const { data: group } = await supabase
      .from('prayer_groups')
      .select('*')
      .eq('id', membership.group_id)
      .single();

    if (!group) return null;

    const { data: members } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .order('chapters_read', { ascending: false });

    const mappedMembers: GroupMember[] = (members || []).map(m => ({
      id: m.id,
      name: m.display_name,
      chaptersRead: m.chapters_read,
      lastRead: m.last_read_at,
      avatar: m.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    }));

    return {
      id: group.id,
      name: group.name,
      description: group.description || '',
      code: group.code,
      members: mappedMembers,
      createdAt: group.created_at,
    };
  } catch {
    return null;
  }
}

export async function getMyGroup(): Promise<Group | null> {
  const userId = await getCurrentUserId();
  if (userId) {
    const fromSupabase = await getGroupFromSupabase(userId);
    if (fromSupabase) return fromSupabase;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function createOrJoinGroup(name: string, description: string): Promise<Group> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const code = `VERBO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const { data: group, error: groupErr } = await supabase
        .from('prayer_groups')
        .insert({ name, description, code, created_by: userId })
        .select()
        .single();

      if (groupErr) throw groupErr;

      const { data: insertedMembers, error: membersErr } = await supabase
        .from('group_members')
        .insert([{ group_id: group.id, user_id: userId, display_name: 'Tu', chapters_read: 0 }])
        .select();

      if (membersErr) throw membersErr;

      const mappedMembers: GroupMember[] = (insertedMembers || []).map(m => ({
        id: m.id,
        name: m.display_name,
        chaptersRead: m.chapters_read,
        lastRead: m.last_read_at,
        avatar: m.display_name === 'Tu'
          ? 'TU'
          : m.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      }));

      return {
        id: group.id,
        name: group.name,
        description: group.description || '',
        code: group.code,
        members: mappedMembers,
        createdAt: group.created_at,
      };
    } catch {
      // fall through to AsyncStorage
    }
  }

  const group: Group = {
    id: `group_${Date.now()}`,
    name,
    description,
    code: `VERBO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    members: [],
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(group));
  return group;
}

export async function joinGroupByCode(code: string): Promise<Group | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const { data: group } = await supabase
      .from('prayer_groups')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();

    if (!group) return null;

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      const { data: authData } = await supabase.auth.getSession();
      const displayName = authData.session?.user?.user_metadata?.full_name || authData.session?.user?.email?.split('@')[0] || 'Miembro';
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: userId,
        display_name: displayName,
        chapters_read: 0,
      });
    }

    return getGroupFromSupabase(userId);
  } catch {
    return null;
  }
}

export async function leaveGroup(): Promise<void> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membership) {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', membership.group_id)
          .eq('user_id', userId);

        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', membership.group_id);

        if (count === 0) {
          await supabase.from('prayer_groups').delete().eq('id', membership.group_id);
        }
      }
    } catch {
      // fall through
    }
  }

  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function logGroupReading(userName: string, chapterName: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membership) {
        await supabase.from('group_reading_log').insert({
          group_id: membership.group_id,
          user_id: userId,
          user_name: userName,
          chapter_name: chapterName,
        });

        const { data: member } = await supabase
          .from('group_members')
          .select('chapters_read')
          .eq('group_id', membership.group_id)
          .eq('user_id', userId)
          .single();

        if (member) {
          await supabase
            .from('group_members')
            .update({ chapters_read: (member.chapters_read || 0) + 1, last_read_at: new Date().toISOString() })
            .eq('group_id', membership.group_id)
            .eq('user_id', userId);
        }
      }
    } catch {
      // fall through
    }
  }

  try {
    const raw = await AsyncStorage.getItem(GROUP_READING_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ userName, chapterName, date: new Date().toISOString() });
    await AsyncStorage.setItem(GROUP_READING_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {}
}

export async function getGroupReadingLog(): Promise<{ userName: string; chapterName: string; date: string }[]> {
  const userId = await getCurrentUserId();

  if (userId) {
    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membership) {
        const { data: logs } = await supabase
          .from('group_reading_log')
          .select('*')
          .eq('group_id', membership.group_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (logs && logs.length > 0) {
          return logs.map(l => ({
            userName: l.user_name,
            chapterName: l.chapter_name,
            date: l.created_at,
          }));
        }
      }
    } catch {
      // fall through
    }
  }

  try {
    const raw = await AsyncStorage.getItem(GROUP_READING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
