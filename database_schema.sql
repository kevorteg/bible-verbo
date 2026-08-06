-- Database Schema for Verbo Bible Application
-- Compatible with PostgreSQL
-- REVISED: Matches code expectations (profiles table, encrypted columns, etc.)

-- ==============================================================================
-- 1. PROFILES TABLE (referenced by authService.ts, userService.ts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- 2. USER STATS TABLE (legacy, kept for backward compat)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE
);

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS chapters_read INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS notes_count INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS current_level VARCHAR(50) DEFAULT 'Creyente';

-- ==============================================================================
-- 3. NOTES TABLE (userService.ts uses encrypted_content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS book_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS chapter_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS verse_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_user_verse ON notes(user_id, verse_id);

-- ==============================================================================
-- 4. BOOKMARKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS book_name VARCHAR(100);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS chapter_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_id VARCHAR(50);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ==============================================================================
-- 5. CHAT HISTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS message_text TEXT;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ==============================================================================
-- 6. QUIZ RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS quiz_title VARCHAR(255);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS total_questions INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS topic VARCHAR(50);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ==============================================================================
-- 7. PRAYERS TABLE (for prayer wall)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE prayers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS testimony TEXT;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS prayed_count INT DEFAULT 0;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_prayers_category ON prayers(category);
CREATE INDEX IF NOT EXISTS idx_prayers_created ON prayers(created_at DESC);

-- ==============================================================================
-- 8. PRAYER GROUPS TABLE (for leader tools)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prayer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE prayer_groups ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE prayer_groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE prayer_groups ADD COLUMN IF NOT EXISTS code VARCHAR(20) UNIQUE;
ALTER TABLE prayer_groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE prayer_groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ==============================================================================
-- 9. GROUP MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE group_members ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES prayer_groups(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS chapters_read INT DEFAULT 0;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_member_unique ON group_members(group_id, user_id);

-- ==============================================================================
-- 10. GROUP READING LOG TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS group_reading_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE group_reading_log ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES prayer_groups(id) ON DELETE CASCADE;
ALTER TABLE group_reading_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE group_reading_log ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE group_reading_log ADD COLUMN IF NOT EXISTS chapter_name VARCHAR(255);
ALTER TABLE group_reading_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_group_log_group ON group_reading_log(group_id, created_at DESC);

-- ==============================================================================
-- 11. SERMONS TABLE (matches sermonDataService expected columns)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE sermons ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS preacher VARCHAR(255);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS date VARCHAR(50);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS duration VARCHAR(20);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS verse VARCHAR(100);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS youtube_id VARCHAR(20);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_sermons_category ON sermons(category);
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(date DESC);

-- ==============================================================================
-- 12. INCREMENT PRAYED COUNT FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION increment_prayed_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE prayers SET prayed_count = prayed_count + 1 WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_notes_user_book ON notes(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_chat_user_date ON chat_history(user_id, created_at DESC);

-- ==============================================================================
-- ADMIN FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION grant_verification(admin_user_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (role = 'admin') INTO is_admin FROM profiles WHERE id = admin_user_id;
    IF is_admin THEN
        UPDATE profiles SET role = 'verified' WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can grant verification.';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION revoke_verification(admin_user_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (role = 'admin') INTO is_admin FROM profiles WHERE id = admin_user_id;
    IF is_admin THEN
        UPDATE profiles SET role = 'user' WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can revoke verification.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 12. GROUP CHALLENGES TABLE (Grupos y Retos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS group_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES prayer_groups(id) ON DELETE CASCADE;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS target_chapters INT DEFAULT 0;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_challenges_group_active ON group_challenges(group_id, active) WHERE active;

-- ==============================================================================
-- 13. CHALLENGE CONTRIBUTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS challenge_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE challenge_contributions ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES group_challenges(id) ON DELETE CASCADE;
ALTER TABLE challenge_contributions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE challenge_contributions ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE challenge_contributions ADD COLUMN IF NOT EXISTS chapters_contributed INT DEFAULT 0;
ALTER TABLE challenge_contributions ADD COLUMN IF NOT EXISTS last_contributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_contrib_unique ON challenge_contributions(challenge_id, user_id);
