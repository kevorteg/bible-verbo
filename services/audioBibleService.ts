import { DEFAULT_BIBLE_ID } from '../constants';
import { getBlobAudioUrl, getBookNumberByApiBibleId } from './vercelBlobService';

const API_BIBLE_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY || '';
const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1';

export interface AudioInfo {
  url: string;
  duration: number;
}

async function getFromApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BIBLE_BASE}${endpoint}`;
  if (!API_BIBLE_KEY) {
    throw new Error('API_BIBLE_KEY no configurada');
  }
  const response = await fetch(url, {
    headers: { 'api-key': API_BIBLE_KEY },
  });
  if (!response.ok) {
    throw new Error(`Bible API Error: ${response.status}`);
  }
  return response.json();
}

let cachedBooksOrder: { id: string; name: string }[] = [];

export function setBooksOrder(books: { id: string; name: string }[]): void {
  cachedBooksOrder = books;
}

export async function fetchAudioUrl(
  bookId: string,
  chapterId: string,
  bibleId: string = DEFAULT_BIBLE_ID
): Promise<AudioInfo | null> {
  const bookNumber = getBookNumberByApiBibleId(bookId, cachedBooksOrder);
  if (bookNumber > 0) {
    const chapterStr = chapterId.split('.')?.pop() || '';
    const chapterNum = parseInt(chapterStr, 10);
    if (chapterNum > 0) {
      const blobUrl = getBlobAudioUrl(bookNumber, chapterNum);
      if (blobUrl) {
        try {
          const headResp = await fetch(blobUrl, { method: 'HEAD' });
          if (headResp.ok) {
            return { url: blobUrl, duration: 0 };
          }
        } catch {}
      }
    }
  }

  try {
    const data: any = await getFromApi(
      `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false`
    );
    if (data.data?.audio?.[0]?.url) {
      return {
        url: data.data.audio[0].url,
        duration: data.data.audio[0].duration || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}
