
import { supabase } from './supabaseClient';
import { PrayerRequest } from '../types';

/**
 * Obtiene el feed de oraciones ordenadas por fecha reciente.
 * 
 * LÓGICA DE TESTIMONIOS:
 * Si una petición tiene testimonio (testimony != null), verificamos su fecha de actualización.
 * Si el testimonio tiene más de 24 horas, LO FILTRAMOS (no se muestra).
 * Esto mantiene el muro limpio automáticamente sin necesidad de CRON jobs en backend.
 */
export const getPrayers = async (currentUserId: string): Promise<PrayerRequest[]> => {
  const { data, error } = await supabase
    .from('prayers')
    .select(`
      *,
      prayer_interactions!left(user_id)
    `)
    .order('created_at', { ascending: false })
    .limit(70); 

  if (error) {
    console.error("Error fetching prayers:", error);
    return [];
  }

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  // Filtrado y Mapeo
  const processedData = data.filter((p: any) => {
      if (!p.testimony) return true;
      const testimonyDate = new Date(p.updated_at || p.created_at).getTime();
      return (now - testimonyDate) < ONE_DAY_MS;
  }).map((p: any) => ({
    ...p,
    has_prayed: p.prayer_interactions.some((i: any) => i.user_id === currentUserId)
  }));

  return processedData;
};

/**
 * FUNCIÓN ADMIN: Obtener TODO sin filtros para moderación
 */
export const getAllPrayersForAdmin = async (): Promise<PrayerRequest[]> => {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) throw new Error(error.message);
    
    // Mapeo simple sin verificar interacciones personales
    return data.map((p: any) => ({
      ...p,
      has_prayed: false
    }));
};

/**
 * Publicar una nueva petición
 */
export const createPrayer = async (
  userId: string, 
  content: string, 
  category: string, 
  isAnonymous: boolean,
  authorName: string,
  avatarUrl?: string
) => {
  const { error } = await supabase
    .from('prayers')
    .insert({
      user_id: userId,
      content,
      category,
      is_anonymous: isAnonymous,
      author_name: isAnonymous ? 'Anónimo' : authorName,
      avatar_url: isAnonymous ? null : avatarUrl,
      prayed_count: 0
    });

  if (error) throw new Error(error.message);
};

/**
 * Acción de "Orar por esta petición"
 */
export const prayForRequest = async (prayerId: string, userId: string) => {
  // 1. Insertar interacción
  const { error: insertError } = await supabase
    .from('prayer_interactions')
    .insert({ prayer_id: prayerId, user_id: userId });

  if (insertError) {
      if (insertError.code === '23505') return; // Ya existe, ignorar
      throw new Error(insertError.message);
  }

  // 2. Incrementar contador manual
  const { data } = await supabase.from('prayers').select('prayed_count').eq('id', prayerId).single();
  if (data) {
      await supabase
        .from('prayers')
        .update({ prayed_count: data.prayed_count + 1 })
        .eq('id', prayerId);
  }
};

/**
 * Agregar testimonio (Marcar como respondida)
 */
export const addTestimony = async (prayerId: string, testimony: string) => {
    const { error } = await supabase
        .from('prayers')
        .update({ 
            testimony: testimony,
            updated_at: new Date().toISOString() 
        })
        .eq('id', prayerId);
    
    if (error) throw new Error(error.message);
};

/**
 * Borrar petición (Solo dueño o Admin)
 */
export const deletePrayer = async (prayerId: string) => {
    const { error } = await supabase
        .from('prayers')
        .delete()
        .eq('id', prayerId);
    
    if (error) throw new Error(error.message);
};
