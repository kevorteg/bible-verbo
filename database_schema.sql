-- Database Schema for Verbo Bible Application
-- Compatible with PostgreSQL (Supabase)
--
-- NOTA: El código REAL usa la tabla `profiles`, NO `users`.
-- Este schema refleja la estructura real que el código espera.

-- ==============================================================================
-- 1. PROFILES (tabla principal de usuarios, vinculada a auth.users de Supabase)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"chaptersRead":0,"notesCount":0,"streakDays":0}'::jsonb;


-- ==============================================================================
-- 2. NOTES (con contenido cifrado)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS verse_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Unique constraint para upsert por (user_id, verse_id)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_user_verse_unique') THEN
        ALTER TABLE notes ADD CONSTRAINT notes_user_verse_unique UNIQUE (user_id, verse_id);
    END IF;
END $$;


-- ==============================================================================
-- 3. BOOKMARKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_id VARCHAR(50);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS book_name VARCHAR(100);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS chapter_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 4. CHAT HISTORY (con contenido cifrado)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 5. PRAYERS (Muro de Clamor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE prayers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Otros';
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS prayed_count INT DEFAULT 0;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS testimony TEXT;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 6. PRAYER INTERACTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE prayer_interactions ADD COLUMN IF NOT EXISTS prayer_id UUID REFERENCES prayers(id) ON DELETE CASCADE;
ALTER TABLE prayer_interactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayer_interactions_unique') THEN
        ALTER TABLE prayer_interactions ADD CONSTRAINT prayer_interactions_unique UNIQUE (prayer_id, user_id);
    END IF;
END $$;


-- ==============================================================================
-- 7. QUIZ RESULTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS total_questions INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS topic VARCHAR(50);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_notes_user_verse ON notes(user_id, verse_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_date ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_interactions_prayer ON prayer_interactions(prayer_id);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar admin (evita bucle de RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING ( is_admin() );

DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
CREATE POLICY "Users can see own profile" ON profiles
FOR SELECT USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK ( auth.uid() = id );

-- PRAYERS
DROP POLICY IF EXISTS "Anyone can read prayers" ON prayers;
CREATE POLICY "Anyone can read prayers" ON prayers
FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Authenticated users can create prayers" ON prayers;
CREATE POLICY "Authenticated users can create prayers" ON prayers
FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update own prayers" ON prayers;
CREATE POLICY "Users can update own prayers" ON prayers
FOR UPDATE USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can delete any prayer" ON prayers;
CREATE POLICY "Admins can delete any prayer" ON prayers
FOR DELETE USING ( is_admin() );

-- PRAYER INTERACTIONS
DROP POLICY IF EXISTS "Authenticated users can interact" ON prayer_interactions;
CREATE POLICY "Authenticated users can interact" ON prayer_interactions
FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can read interactions" ON prayer_interactions;
CREATE POLICY "Users can read interactions" ON prayer_interactions
FOR SELECT USING ( true );

-- NOTES
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes" ON notes
FOR ALL USING ( auth.uid() = user_id );

-- BOOKMARKS
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
FOR ALL USING ( auth.uid() = user_id );

-- CHAT HISTORY
DROP POLICY IF EXISTS "Users can manage own chat" ON chat_history;
CREATE POLICY "Users can manage own chat" ON chat_history
FOR ALL USING ( auth.uid() = user_id );

-- QUIZ RESULTS
DROP POLICY IF EXISTS "Users can manage own quiz results" ON quiz_results;
CREATE POLICY "Users can manage own quiz results" ON quiz_results
FOR ALL USING ( auth.uid() = user_id );
