export function normalizeBookName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getLocalAudioUrl(
  bookNumber: number,
  bookName: string,
  chapterNum: number,
): string {
  const folderNum = String(bookNumber).padStart(2, '0');
  const normalized = normalizeBookName(bookName);
  return `/audio/Biblia/${folderNum} - ${bookName}/${chapterNum}-${normalized}.mp3`;
}

export function checkLocalAudioExists(
  bookNumber: number,
  bookName: string,
  chapterNum: number,
): Promise<boolean> {
  const url = getLocalAudioUrl(bookNumber, bookName, chapterNum);
  return fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
}
