import { Book, Chapter, Verse, BibleContentNode } from '../types';

const API_BIBLE_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY || '';
const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1';

async function getFromApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BIBLE_BASE}${endpoint}`;

  if (!API_BIBLE_KEY) {
    throw new Error('API_BIBLE_KEY no configurada. Agrega EXPO_PUBLIC_BIBLE_API_KEY en .env');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'api-key': API_BIBLE_KEY,
      },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error || errorJson.message || errorDetail;
      } catch {}
      throw new Error(`Bible API Error: ${errorDetail}`);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Network request failed') {
      throw new Error('No se pudo conectar con la API de la Biblia. Verifica tu conexion a internet.');
    }
    throw err;
  }
}

export const fetchBooks = async (bibleId: string): Promise<Book[]> => {
  try {
    const data: { data: Book[] } = await getFromApi(`/bibles/${bibleId}/books`);
    return data.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export const fetchChapters = async (bibleId: string, bookId: string): Promise<Chapter[]> => {
  try {
    const data: { data: Chapter[] } = await getFromApi(`/bibles/${bibleId}/books/${bookId}/chapters`);
    return data.data.filter(c => c.number !== 'intro');
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
};

export const fetchChapterContent = async (bibleId: string, chapterId: string): Promise<Verse[]> => {
  try {
    const endpoint = `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false`;
    const data: { data: { content: BibleContentNode[] } } = await getFromApi(endpoint);

    const extractedVerses: Verse[] = [];
    let tempVerseNum: string | null = null;

    const parse = (nodes: BibleContentNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'tag' && n.name === 'verse') {
          tempVerseNum = n.attrs?.number || null;
        }

        if (n.text && tempVerseNum) {
          const existingVerse = extractedVerses.find(v => v.number === tempVerseNum);
          let cleanText = n.text;

          if (cleanText.trim().startsWith(tempVerseNum)) {
            cleanText = cleanText.trim().replace(new RegExp(`^${tempVerseNum}\\s*`), '');
          }

          if (existingVerse) {
            existingVerse.text += cleanText;
          } else {
            extractedVerses.push({
              id: n.verseId || `${chapterId}-${tempVerseNum}`,
              number: tempVerseNum,
              text: cleanText,
            });
          }
        }

        if (n.items) {
          parse(n.items);
        }
      });
    };

    if (data.data && data.data.content) {
      parse(data.data.content);
    }

    return extractedVerses;
  } catch (error) {
    console.error('Error fetching verses:', error);
    throw error;
  }
};
