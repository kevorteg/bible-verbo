import { put } from '@vercel/blob';
import { readdirSync, createReadStream } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const STORE_ID = process.env.BLOB_STORE_ID;
const AUDIO_DIR = join(__dirname, '..', 'static', 'audio', 'Biblia');

if (!TOKEN || !STORE_ID) {
  console.error('Uso: $env:BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..." ; $env:BLOB_STORE_ID="store_..." ; node scripts/upload-audio.mjs');
  process.exit(1);
}

async function walk(dir) {
  let files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(await walk(full));
    else if (entry.name.endsWith('.mp3')) files.push(full);
  }
  return files;
}

async function upload() {
  const files = await walk(AUDIO_DIR);
  console.log(`Subiendo ${files.length} archivos (${(files.reduce((s, f) => s + 0, 0) / 1024 / 1024).toFixed(1)} MB)...`);

  let ok = 0, fail = 0;
  for (const [i, file] of files.entries()) {
    const relativePath = relative(AUDIO_DIR, file).replace(/\\/g, '/');
    const blobPath = `audio/Biblia/${relativePath}`;
    try {
      const result = await put(blobPath, createReadStream(file), {
        access: 'public', token: TOKEN, addRandomSuffix: false,
      });
      console.log(`[${i + 1}/${files.length}] OK: ${relativePath}`);
      ok++;
    } catch (err) {
      console.error(`[${i + 1}/${files.length}] FAIL: ${relativePath} - ${err.message}`);
      fail++;
    }
  }
  console.log(`\nCompletado: ${ok} OK, ${fail} fallos`);
  console.log(`URL base: https://${STORE_ID}.public.blob.vercel-storage.com`);
}

upload().catch(console.error);
