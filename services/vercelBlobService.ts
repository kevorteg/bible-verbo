const BLOB_BASE_URL = 'https://kd3dyljmdmmgmsyw.public.blob.vercel-storage.com';
const BLOB_PREFIX = 'audio/Biblia';

const SPANISH_BOOKS: string[] = [
  'Genesis', 'Exodo', 'Levitico', 'Numeros', 'Deuteronomio',
  'Josue', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Cronicas', '2 Cronicas', 'Esdras',
  'Nehemias', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastes', 'Cantares', 'Isaias', 'Jeremias', 'Lamentaciones',
  'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amos',
  'Abdias', 'Jonas', 'Miqueas', 'Nahum', 'Habacuc',
  'Sofonias', 'Hageo', 'Zacarias', 'Malaquias',
  'Mateo', 'Marcos', 'Lucas', 'Juan',
  'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Galatas',
  'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
  '1 Timoteo', '2 Timoteo', 'Tito', 'Filemon', 'Hebreos',
  'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
];

export function getBlobAudioUrl(bookNumber: number, chapterNumber: number): string {
  const idx = bookNumber - 1;
  if (idx < 0 || idx >= SPANISH_BOOKS.length) return '';
  const bookNum = bookNumber.toString().padStart(2, '0');
  const bookName = SPANISH_BOOKS[idx];
  const folder = `${bookNum} - ${bookName}`;
  const filename = `${chapterNumber}-${bookName}.mp3`;
  return `${BLOB_BASE_URL}/${BLOB_PREFIX}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

export function getBookNumberByApiBibleId(apiBibleId: string, booksInOrder: { id: string; name: string }[]): number {
  const idx = booksInOrder.findIndex(b => b.id === apiBibleId);
  if (idx >= 0 && idx < 66) return idx + 1;
  return 0;
}

export function getBookName(index: number): string {
  const idx = index - 1;
  if (idx >= 0 && idx < SPANISH_BOOKS.length) return SPANISH_BOOKS[idx];
  return '';
}

export async function checkBlobAvailability(bookNumber: number, chapterNumber: number): Promise<boolean> {
  try {
    const url = getBlobAudioUrl(bookNumber, chapterNumber);
    if (!url) return false;
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
