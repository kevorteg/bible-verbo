
import { supabase } from './supabaseClient';
import { encryptData, decryptData } from './encryptionService';
import { NoteMap, Bookmark, ChatMessage, User } from '../types';

// GESTIÓN DE NOTAS (CIFRADAS)
export const syncNotes = async (userId: string): Promise<NoteMap> => {
  const { data, error } = await supabase
    .from('notes')
    .select('verse_id, encrypted_content')
    .eq('user_id', userId);

  if (error) { return {}; }

  const notes: NoteMap = {};
  data.forEach((row: any) => {
    if (row.encrypted_content) {
      notes[row.verse_id] = decryptData(row.encrypted_content);
    }
  });
  return notes;
};

export const saveNote = async (userId: string, verseId: string, content: string) => {
  const encryptedContent = encryptData(content);
  const { error } = await supabase
    .from('notes')
    .upsert({
      user_id: userId,
      verse_id: verseId,
      encrypted_content: encryptedContent,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, verse_id' });
  if (error) console.error("Error saving note:", error);
};

// GESTIÓN DE FAVORITOS
export const syncBookmarks = async (userId: string): Promise<Bookmark[]> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);

  if (error) { return []; }

  return data.map((row: any) => ({
    id: row.verse_id,
    number: row.verse_num,
    text: row.verse_text,
    bookName: row.book_name,
    chapterNum: row.chapter_num
  }));
};

export const toggleBookmark = async (userId: string, bookmark: Bookmark, isAdding: boolean) => {
  if (isAdding) {
    await supabase.from('bookmarks').insert({
      user_id: userId,
      verse_id: bookmark.id,
      verse_num: bookmark.number,
      verse_text: bookmark.text,
      book_name: bookmark.bookName,
      chapter_num: bookmark.chapterNum
    });
  } else {
    await supabase.from('bookmarks').delete().match({ user_id: userId, verse_id: bookmark.id });
  }
};

// GESTIÓN DE CHAT
export const syncChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    role: row.role,
    text: decryptData(row.encrypted_content),
    image: row.image_url
  }));
};

export const saveChatMessage = async (userId: string, message: ChatMessage) => {
  const encryptedContent = encryptData(message.text);
  await supabase.from('chat_history').insert({
    id: typeof message.id === 'string' ? message.id : undefined,
    user_id: userId,
    role: message.role,
    encrypted_content: encryptedContent,
    image_url: message.image || null,
    created_at: new Date().toISOString()
  });
};

export const clearChatHistory = async (userId: string) => {
  await supabase.from('chat_history').delete().eq('user_id', userId);
};

// GESTIÓN DE PERFIL
export const updateUserProfile = async (userId: string, updates: { name?: string; avatar?: string }) => {
  const updateData: any = {};
  if (updates.name) updateData.encrypted_name = updates.name;
  if (updates.avatar) updateData.avatar = updates.avatar;

  const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
  if (error) console.error("Error updating profile", error);
};

export const saveUserLocation = async (userId: string, location: { lat: number; lng: number }) => {
  const dataToEncrypt = JSON.stringify({ location });
  const encryptedData = encryptData(dataToEncrypt);
  await supabase.from('profiles').update({ encrypted_data: encryptedData }).eq('id', userId);
};

// --- FUNCIONES ADMINISTRATIVAS ---

export const getAllUsers = async (): Promise<User[]> => {
  // Obtenemos perfiles y también correos si es posible (Auth API a veces limita correos, pero Profiles tiene email si lo guardamos o lo unimos)
  // Para simplificar, asumimos que Profile tiene todo lo necesario salvo el correo real si no lo guardamos.
  // NOTA: Para obtener el email real de auth.users se requiere Service Role o una funcion Edge. 
  // Usaremos lo que hay en profiles y encrypted_name.

  // Obtenemos todos los perfiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('joined_date', { ascending: false });

  if (error) throw new Error(error.message);

  // Para obtener emails reales necesitamos llamar a auth.users, pero el cliente JS no puede listar todos los usuarios por seguridad.
  // Truco: Asumiremos que el admin conoce el email o mostraremos el ID/Nombre.

  return profiles.map((p: any) => ({
    id: p.id,
    name: p.encrypted_name || 'Sin Nombre', // Asumimos texto plano
    email: 'Privado', // No podemos leer email de otros usuarios sin ser Service Role
    role: p.role || 'user',
    isVerified: p.is_verified || false, // Mapping de la columna is_verified
    joinedDate: p.joined_date,
    stats: p.stats,
    avatar: p.avatar
  }));
};

export const updateUserRole = async (targetUserId: string, newRole: 'user' | 'leader' | 'admin') => {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message);
};

export const updateUserVerification = async (targetUserId: string, isVerified: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: isVerified })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message);
};

export const getEncryptedChatHistory = async (targetUserId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return data; // Retorna datos CIFRADOS
};
