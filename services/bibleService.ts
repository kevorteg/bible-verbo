import { BibleApiResponse, Book, Chapter, Verse, BibleContentNode } from '../types';

/**
 * Realiza peticiones a través del proxy de Vercel (servidor) para ocultar la API Key.
 */
async function getFromApi<T>(endpoint: string): Promise<T> {
  const url = `/api/bible?path=${encodeURIComponent(endpoint)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.error || `Server Error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Bible Proxy Fetch Error:", err);
    throw err;
  }
}

export const fetchBooks = async (bibleId: string): Promise<Book[]> => {
  try {
    const data: BibleApiResponse<Book[]> = await getFromApi(`/${bibleId}/books`);
    return data.data;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

export const fetchChapters = async (bibleId: string, bookId: string): Promise<Chapter[]> => {
  try {
    const data: BibleApiResponse<Chapter[]> = await getFromApi(`/${bibleId}/books/${bookId}/chapters`);
    // Filter out intro chapters typically marked as 'intro'
    return data.data.filter(c => c.number !== 'intro');
  } catch (error) {
    console.error("Error fetching chapters:", error);
    throw error;
  }
};

export interface AudioInfo {
  url: string;
  duration: number;
  mimeType: string;
}

export const fetchChapterAudio = async (bibleId: string, chapterId: string): Promise<AudioInfo | null> => {
  try {
    const data: any = await getFromApi(`/${bibleId}/chapters/${chapterId}/audio`);
    if (data?.data?.audio?.url) {
      return {
        url: data.data.audio.url,
        duration: data.data.audio.duration || 0,
        mimeType: data.data.audio.mimeType || 'audio/mpeg',
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const fetchChapterContent = async (bibleId: string, chapterId: string): Promise<Verse[]> => {
  try {
    const endpoint = `/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false`;
    const data: BibleApiResponse<{ content: BibleContentNode[] }> = await getFromApi(endpoint);
    
    const extractedVerses: Verse[] = [];
    let tempVerseNum: string | null = null;

    // Recursive parser for the Bible JSON content structure
    const parse = (nodes: BibleContentNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'tag' && n.name === 'verse') {
          tempVerseNum = n.attrs?.number || null;
        }
        
        if (n.text && tempVerseNum) {
          const existingVerse = extractedVerses.find(v => v.number === tempVerseNum);
          let cleanText = n.text;
          
          // Remove leading verse number if present in text
          if (cleanText.trim().startsWith(tempVerseNum)) {
            cleanText = cleanText.trim().replace(new RegExp(`^${tempVerseNum}\\s*`), "");
          }
          
          if (existingVerse) {
            existingVerse.text += cleanText;
          } else {
            extractedVerses.push({
              id: n.verseId || `${chapterId}-${tempVerseNum}`,
              number: tempVerseNum,
              text: cleanText
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
    console.error("Error fetching verses:", error);
    throw error;
  }
};
