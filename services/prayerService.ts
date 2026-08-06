import { supabase } from './supabaseClient';
import { PrayerRequest } from '../types';

export const fetchPrayers = async (): Promise<PrayerRequest[]> => {
  const { data, error } = await supabase
    .from('prayers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createPrayer = async (prayer: Partial<PrayerRequest>): Promise<void> => {
  const { error } = await supabase.from('prayers').insert(prayer);
  if (error) throw new Error(error.message);
};

export const prayForRequest = async (prayerId: string): Promise<void> => {
  const { data, error } = await supabase.rpc('increment_prayed_count', {
    prayer_id: prayerId,
  });
  if (error) throw new Error(error.message);
};
