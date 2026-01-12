-- ALERTA: Tu App usa la tabla 'profiles', no 'users'.
-- Este script arregla los permisos (RLS) para que el Admin pueda ver a todos.

-- 1. Habilitar seguridad nivel fila (RLS) en profiles (si no está activa)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Política: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
CREATE POLICY "Users can see own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 3. Política: Los ADMIN pueden ver TODOS los perfiles
-- Esta es la clave para que aparezcan en el Dashboard.
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Política: Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 5. Asegurar que las columnas existan (Sincronizando con tu código actual)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats JSONB;

-- Si tienes datos en 'users' (del script anterior) y quieres moverlos a 'profiles', avísame.
-- Por ahora, esto hará que "andrees" aparezca en tu Dashboard.
