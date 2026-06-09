export function normalizeBookName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getRelativePath(bookNumber: number, bookName: string, chapterNum: number): string {
  const folderNum = String(bookNumber).padStart(2, '0');
  const normalized = normalizeBookName(bookName);
  return `${folderNum} - ${bookName}/${chapterNum}-${normalized}.mp3`;
}

function encodePath(segment: string): string {
  return segment.split('/').map(encodeURIComponent).join('/');
}

export function getLocalAudioUrl(
  bookNumber: number,
  bookName: string,
  chapterNum: number,
): string {
  const relative = getRelativePath(bookNumber, bookName, chapterNum);
  const baseUrl = import.meta.env.VITE_BLOB_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/audio/Biblia/${encodePath(relative)}`;
  }
  return `/audio/Biblia/${relative}`;
}

export function checkLocalAudioExists(
  bookNumber: number,
  bookName: string,
  chapterNum: number,
): Promise<boolean> {
  const url = getLocalAudioUrl(bookNumber, bookName, chapterNum);
  return fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
}
