
import { API_BIBLE_KEY } from '../constants';
import { BibleApiResponse, Book, Chapter, Verse, BibleContentNode } from '../types';

const BASE_URL = 'https://api.scripture.api.bible/v1/bibles';

// Proxy CORS para resolver el problema de "NetworkError" en el navegador
const PROXY_URL = 'https://corsproxy.io/?';

const headers = {
  "api-key": API_BIBLE_KEY
};

/**
 * Función auxiliar para realizar peticiones manejando el proxy automáticamente.
 * Intenta primero vía proxy (para evitar CORS) y si falla, intenta directo.
 */
async function getFromApi<T>(endpoint: string): Promise<T> {
  const fullUrl = `${BASE_URL}${endpoint}`;
  
  // Usamos el proxy para envolver la URL de destino
  const proxiedUrl = `${PROXY_URL}${encodeURIComponent(fullUrl)}`;

  try {
    const response = await fetch(proxiedUrl, { headers });
    if (!response.ok) {
       // Si el proxy devuelve error, lanzamos excepción para intentar el fallback
       throw new Error(`Proxy/API Error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn("Intento con proxy falló, intentando conexión directa...", err);
    // Fallback: Intento directo (útil si el proxy cae o si el entorno no es un navegador estricto)
    const response = await fetch(fullUrl, { headers });
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
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
