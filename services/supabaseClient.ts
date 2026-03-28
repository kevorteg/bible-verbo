
import { createClient } from '@supabase/supabase-js';

// URL obtenida de tu Project ID
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hyvkfzhsrdfernuzenfk.supabase.co'; 

// Tu API Key pública
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iD75wCUaD6rCYoZGiPbHnA_Wuc_leXW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
