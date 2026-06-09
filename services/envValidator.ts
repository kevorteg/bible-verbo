const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_API_BIBLE_KEY',
] as const;

const CONFIG_VARS = [
  'GEMINI_API_KEY',
  'API_BIBLE_KEY',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[envValidator] Missing required env vars: ${missing.join(', ')}. ` +
      'Some features may not work. Create a .env file based on .env.example.'
    );
  }
}

export function getServerEnv(key: (typeof CONFIG_VARS)[number]): string {
  return process.env[key] || import.meta.env[`VITE_${key}`] || '';
}
