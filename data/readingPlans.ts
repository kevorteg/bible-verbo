export interface ReadingDay {
  day: number;
  bookId: string;
  chapter: number;
  endChapter?: number;
  title?: string;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  icon: string;
  days: ReadingDay[];
}

const NT_BOOKS = [
  { id: 'MAT', ch: 28 }, { id: 'MRK', ch: 16 }, { id: 'LUK', ch: 24 },
  { id: 'JHN', ch: 21 }, { id: 'ACT', ch: 28 }, { id: 'ROM', ch: 16 },
  { id: '1CO', ch: 16 }, { id: '2CO', ch: 13 }, { id: 'GAL', ch: 6 },
  { id: 'EPH', ch: 6 }, { id: 'PHP', ch: 4 }, { id: 'COL', ch: 4 },
  { id: '1TH', ch: 5 }, { id: '2TH', ch: 3 }, { id: '1TI', ch: 6 },
  { id: '2TI', ch: 4 }, { id: 'TIT', ch: 3 }, { id: 'PHM', ch: 1 },
  { id: 'HEB', ch: 13 }, { id: 'JAS', ch: 5 }, { id: '1PE', ch: 5 },
  { id: '2PE', ch: 3 }, { id: '1JN', ch: 5 }, { id: '2JN', ch: 1 },
  { id: '3JN', ch: 1 }, { id: 'JUD', ch: 1 }, { id: 'REV', ch: 22 },
];

const PSALMS = Array.from({ length: 150 }, (_, i) => ({
  id: 'PSA', chapter: i + 1,
}));

const PROVERBS = Array.from({ length: 31 }, (_, i) => ({
  id: 'PRO', chapter: i + 1,
}));

function generateNt30Days(): ReadingDay[] {
  const days: ReadingDay[] = [];
  let day = 1;
  for (const book of NT_BOOKS) {
    for (let ch = 1; ch <= book.ch; ch++) {
      if (days.length < 30) {
        days.push({ day: day++, bookId: book.id, chapter: ch });
      }
    }
  }
  while (days.length < 30) {
    days.push({ day: days.length + 1, bookId: 'JHN', chapter: 1 });
  }
  return days;
}

function generateNtYear(): ReadingDay[] {
  const days: ReadingDay[] = [];
  let day = 1;
  for (const book of NT_BOOKS) {
    for (let ch = 1; ch <= book.ch; ch++) {
      days.push({ day: day++, bookId: book.id, chapter: ch });
    }
  }
  return days;
}

function generateSalmos7Dias(): ReadingDay[] {
  const perDay = Math.ceil(PSALMS.length / 7);
  const days: ReadingDay[] = [];
  for (let d = 0; d < 7; d++) {
    const start = d * perDay + 1;
    const end = Math.min((d + 1) * perDay, PSALMS.length);
    days.push({
      day: d + 1,
      bookId: 'PSA',
      chapter: start,
      endChapter: end > start ? end : undefined,
      title: `Salmos ${start}-${end}`,
    });
  }
  return days;
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'nt-30',
    name: 'Nuevo Testamento en 30 Días',
    description: 'Lee el Nuevo Testamento completo en un mes. Lectura intensiva (~4 capítulos/día).',
    durationDays: 30,
    icon: 'zap',
    days: generateNt30Days(),
  },
  {
    id: 'salmos-7',
    name: 'Salmos en 7 Días',
    description: 'Recorre los 150 Salmos en una semana. Perfecto para momentos de oración.',
    durationDays: 7,
    icon: 'heart',
    days: generateSalmos7Dias(),
  },
  {
    id: 'nt-year',
    name: 'Nuevo Testamento en 1 Año',
    description: 'Un capítulo al día. Completa el NT en un año sin prisas.',
    durationDays: 260,
    icon: 'book',
    days: generateNtYear(),
  },
  {
    id: 'proverbios-31',
    name: 'Proverbios (Mensual)',
    description: 'Un capítulo de Proverbios cada día del mes. Sabiduría diaria.',
    durationDays: 31,
    icon: 'star',
    days: PROVERBS.map((p, i) => ({ day: i + 1, bookId: p.id, chapter: p.chapter })),
  },
];
