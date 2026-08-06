import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChapterContent } from './bibleService';

const BIBLE_ID = '826f63861180e056-01';
const CACHE_KEY = 'verbo_daily_devotional';
const DEFAULT_VERSE = {
  book: 'Salmos',
  chapter: '1',
  verse: '1-2',
  text: 'Bienaventurado el varon que no anduvo en consejo de malos, ni estuvo en camino de pecadores, ni en silla de escarnecedores se ha sentado; sino que en la ley de Jehova esta su delicia, y en su ley medita de dia y de noche.',
  reference: 'Salmo 1:1-2',
};

const DAILY_CHAPTERS: [string, string][] = [
  ['GEN', '1'], ['EXO', '1'], ['LEV', '1'], ['NUM', '1'], ['DEU', '1'],
  ['JOS', '1'], ['JDG', '1'], ['RUT', '1'], ['1SA', '1'], ['2SA', '1'],
  ['1KI', '1'], ['2KI', '1'], ['1CH', '1'], ['2CH', '1'], ['EZR', '1'],
  ['NEH', '1'], ['EST', '1'], ['JOB', '1'], ['PSA', '1'], ['PRO', '1'],
  ['ECC', '1'], ['SNG', '1'], ['ISA', '1'], ['JER', '1'], ['LAM', '1'],
  ['EZK', '1'], ['DAN', '1'], ['HOS', '1'], ['JOL', '1'], ['AMO', '1'],
  ['OBA', '1'], ['JON', '1'], ['MIC', '1'], ['NAM', '1'], ['HAB', '1'],
  ['ZEP', '1'], ['HAG', '1'], ['ZEC', '1'], ['MAL', '1'],
  ['MAT', '1'], ['MRK', '1'], ['LUK', '1'], ['JHN', '1'], ['ACT', '1'],
  ['ROM', '1'], ['1CO', '1'], ['2CO', '1'], ['GAL', '1'], ['EPH', '1'],
  ['PHP', '1'], ['COL', '1'], ['1TH', '1'], ['2TH', '1'], ['1TI', '1'],
  ['2TI', '1'], ['TIT', '1'], ['PHM', '1'], ['HEB', '1'], ['JAS', '1'],
  ['1PE', '1'], ['2PE', '1'], ['1JN', '1'], ['2JN', '1'], ['3JN', '1'],
  ['JUD', '1'], ['REV', '1'],
];

export interface DailyDevotional {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  reference: string;
}

function getDefaultForToday(): DailyDevotional {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const idx = dayOfYear % DAILY_CHAPTERS.length;
  const [book, chapter] = DAILY_CHAPTERS[idx];
  return {
    book,
    chapter,
    verse: '1',
    text: `Lectura del dia: ${book} ${chapter}. Abre tu Biblia y lee este capitulo.`,
    reference: `${book} ${chapter}`,
  };
}

export async function fetchDailyDevotional(): Promise<DailyDevotional> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached.date === today) {
        return cached.data;
      }
    }

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const idx = dayOfYear % DAILY_CHAPTERS.length;
    const [bookId, chapterNum] = DAILY_CHAPTERS[idx];
    const chapterId = `${bookId}.${chapterNum}`;

    let text = '';
    let firstVerse = '1';
    const verses = await fetchChapterContent(BIBLE_ID, chapterId);
    if (verses.length > 0) {
      const preview = verses.slice(0, 3);
      text = preview.map(v => v.text).join(' ');
      firstVerse = preview.length === 1 ? verses[0].number : `${verses[0].number}-${verses[preview.length - 1].number}`;
    }

    const bookNames: Record<string, string> = {
      GEN: 'Genesis', EXO: 'Exodo', LEV: 'Levitico', NUM: 'Numeros', DEU: 'Deuteronomio',
      JOS: 'Josue', JDG: 'Jueces', RUT: 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
      '1KI': '1 Reyes', '2KI': '2 Reyes', '1CH': '1 Cronicas', '2CH': '2 Cronicas',
      EZR: 'Esdras', NEH: 'Nehemias', EST: 'Ester', JOB: 'Job', PSA: 'Salmos',
      PRO: 'Proverbios', ECC: 'Eclesiastes', SNG: 'Cantares', ISA: 'Isaias',
      JER: 'Jeremias', LAM: 'Lamentaciones', EZK: 'Ezequiel', DAN: 'Daniel',
      HOS: 'Oseas', JOL: 'Joel', AMO: 'Amos', OBA: 'Abdias', JON: 'Jonas',
      MIC: 'Miqueas', NAM: 'Nahum', HAB: 'Habacuc', ZEP: 'Sofonias',
      HAG: 'Hageo', ZEC: 'Zacarias', MAL: 'Malaquias',
      MAT: 'Mateo', MRK: 'Marcos', LUK: 'Lucas', JHN: 'Juan', ACT: 'Hechos',
      ROM: 'Romanos', '1CO': '1 Corintios', '2CO': '2 Corintios', GAL: 'Galatas',
      EPH: 'Efesios', PHP: 'Filipenses', COL: 'Colosenses', '1TH': '1 Tesalonicenses',
      '2TH': '2 Tesalonicenses', '1TI': '1 Timoteo', '2TI': '2 Timoteo',
      TIT: 'Tito', PHM: 'Filemon', HEB: 'Hebreos', JAS: 'Santiago',
      '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Juan', '2JN': '2 Juan',
      '3JN': '3 Juan', JUD: 'Judas', REV: 'Apocalipsis',
    };

    const bookName = bookNames[bookId] || bookId;
    const result: DailyDevotional = {
      book: bookId,
      chapter: chapterNum,
      verse: firstVerse,
      text: text || `Lectura del dia: ${bookName} ${chapterNum}.`,
      reference: `${bookName} ${chapterNum}:${firstVerse}`,
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data: result }));
    return result;
  } catch {
    return getDefaultForToday();
  }
}
