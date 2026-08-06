import { supabase } from './supabaseClient';
import { decryptData } from './encryptionService';
import { User } from '../types';

const parseEncryptedData = (cipherText: string) => {
  if (!cipherText) return undefined;
  try {
    const jsonStr = decryptData(cipherText);
    return jsonStr ? JSON.parse(jsonStr) : undefined;
  } catch {
    return undefined;
  }
};

const resolveName = (rawName: string): string => {
  if (!rawName) return 'Usuario';
  if (rawName.startsWith('U2FsdGVkX1')) {
    try {
      const decrypted = decryptData(rawName);
      if (decrypted) return decrypted;
    } catch {}
  }
  return rawName;
};

export const getSession = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return fetchProfileAndReturnUser(session.user);
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('No se pudo obtener el usuario');
  return fetchProfileAndReturnUser(data.user);
};

export const loginWithMagicCode = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
};

export const verifyEmailOtp = async (email: string, token: string): Promise<User> => {
  let { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });

  if (error) {
    const { data: data2, error: error2 } = await supabase.auth.verifyOtp({ email, token, type: 'magiclink' });
    if (error2) {
      const { data: data3, error: error3 } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      if (error3) throw new Error('Codigo invalido o expirado.');
      data = data3;
    } else {
      data = data2;
    }
  }
  if (!data?.user) throw new Error('Verificacion fallida');
  return fetchProfileAndReturnUser(data.user);
};

export const sendPasswordResetOtp = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

export const verifyRecoveryOtp = async (email: string, token: string): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) {
    const { error: error2 } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error2) throw new Error('Codigo incorrecto o expirado.');
  }
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

const fetchProfileAndReturnUser = async (authUser: any): Promise<User> => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  const isSuperAdmin = authUser.email === 'milife.ortega2000@gmail.com';

  if (profileError || !profile) {
    if (profileError?.code === 'PGRST116' || !profile) {
      const metaName = authUser.user_metadata?.full_name || 'Usuario';
      const today = new Date().toISOString().split('T')[0];

      const newProfile = {
        id: authUser.id,
        encrypted_name: metaName,
        encrypted_data: '',
        role: isSuperAdmin ? 'admin' : 'user',
        joined_date: new Date().toISOString(),
        stats: { chaptersRead: 0, notesCount: 0, streakDays: 1, lastActivityDate: today },
      };

      await supabase.from('profiles').insert([newProfile]);

      return {
        id: authUser.id,
        email: authUser.email || '',
        name: metaName,
        joinedDate: newProfile.joined_date,
        role: newProfile.role as any,
        stats: newProfile.stats,
      };
    }
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || 'Usuario',
      joinedDate: new Date().toISOString(),
      role: 'user',
      stats: { chaptersRead: 0, notesCount: 0, streakDays: 0 },
    };
  }

  const finalRole = isSuperAdmin ? 'admin' : (profile.role || 'user');

  return {
    id: authUser.id,
    email: authUser.email || '',
    name: resolveName(profile.encrypted_name),
    joinedDate: profile.joined_date,
    role: finalRole,
    location: parseEncryptedData(profile.encrypted_data)?.location,
    stats: profile.stats,
    avatar: profile.avatar,
  };
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Error al crear usuario');

  const isSuperAdmin = email === 'milife.ortega2000@gmail.com';
  const today = new Date().toISOString().split('T')[0];
  const newProfile = {
    id: data.user.id,
    encrypted_name: name,
    encrypted_data: '',
    role: isSuperAdmin ? 'admin' : 'user',
    joined_date: new Date().toISOString(),
    stats: { chaptersRead: 0, notesCount: 0, streakDays: 1, lastActivityDate: today },
  };

  if (data.session) {
    const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
    if (profileError && profileError.code !== '23505') {
      console.error('Error creating profile:', JSON.stringify(profileError));
    }
  }

  if (data.session) {
    return {
      id: data.user.id,
      email,
      name,
      role: newProfile.role as any,
      joinedDate: newProfile.joined_date,
      stats: newProfile.stats,
    };
  }

  throw new Error('CONFIRM_EMAIL');
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const updateUserStats = async (user: User, stats: Partial<User['stats']>): Promise<User> => {
  const newStats = { ...user.stats, ...stats };
  const { error } = await supabase.from('profiles').update({ stats: newStats }).eq('id', user.id);
  if (error) console.error('Error updating stats:', error);
  return { ...user, stats: newStats as any };
};
