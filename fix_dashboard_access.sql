-- SOLUCIÓN: Tus datos NO se han borrado. Están ocultos por el "candado" de seguridad.
-- Este script arregla el problema del "bucle" que impedía verlos.

-- 1. Función Segura para verificar Admin (Rompe el bucle de seguridad)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 'SECURITY DEFINER' es la clave mágica

-- 2. Aseguramos que RLS esté activo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Limpiamos políticas viejas que daban problemas
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 4. Política Maestra: Si es Admin (usando la función segura), ve TODO.
CREATE POLICY "Admins can view all profiles and users" ON profiles
FOR SELECT
USING ( is_admin() );

-- 5. Política Básica: Cada uno ve lo suyo (si no es admin)
CREATE POLICY "Users can see own profile" ON profiles
FOR SELECT
USING ( auth.uid() = id );

-- 6. Política de Edición: Cada uno edita lo suyo
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING ( auth.uid() = id );

-- 7. (Opcional) Asegurar que tú seas admin
-- Esto busca tu usuario por nombre y fuerza el rol, por si acaso.
UPDATE profiles 
SET role = 'admin' 
WHERE encrypted_name ILIKE '%kevin%' OR encrypted_name ILIKE '%admin%';
