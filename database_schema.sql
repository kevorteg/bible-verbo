-- Database Schema for Verbo Bible Application
-- Compatible with PostgreSQL
-- REVISED: Fully Idempotent (Checks for existing tables AND columns)

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Ensure all columns exist (Idempotent updates)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add Constraints if they don't exist (Handling constraints in raw SQL is tricky, 
-- but we assume basic types are correct. Unique on email is critical)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;


-- ==============================================================================
-- 2. USER STATS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS chapters_read INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS notes_count INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS current_level VARCHAR(50) DEFAULT 'Creyente';


-- ==============================================================================
-- 3. NOTES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS book_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS chapter_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS verse_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 4. BOOKMARKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS book_name VARCHAR(100);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS chapter_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_num VARCHAR(10);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 5. CHAT HISTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
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

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS total_questions INT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS topic VARCHAR(50);
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- INDEXES (Using IF NOT EXISTS)
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
    SELECT (role = 'admin') INTO is_admin FROM users WHERE id = admin_user_id;
    IF is_admin THEN
        UPDATE users SET is_verified = TRUE WHERE id = target_user_id;
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
    SELECT (role = 'admin') INTO is_admin FROM users WHERE id = admin_user_id;
    IF is_admin THEN
        UPDATE users SET is_verified = FALSE WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can revoke verification.';
    END IF;
END;
$$ LANGUAGE plpgsql;
