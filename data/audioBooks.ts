export interface AudioBook {
  number: number;
  name: string;
  chapters: number;
}

export interface AudioSection {
  name: string;
  books: AudioBook[];
}

export interface AudioTestament {
  name: string;
  sections: AudioSection[];
}

export const AUDIO_TESTAMENTS: AudioTestament[] = [
  {
    name: "Antiguo Testamento",
    sections: [
      {
        name: "Pentateuco (La Ley)",
        books: [
          { number: 1, name: "G\u00e9nesis", chapters: 50 },
          { number: 2, name: "\u00c9xodo", chapters: 40 },
          { number: 3, name: "Lev\u00edtico", chapters: 27 },
          { number: 4, name: "N\u00fameros", chapters: 35 },
          { number: 5, name: "Deuteronomio", chapters: 34 },
        ],
      },
      {
        name: "Libros Hist\u00f3ricos",
        books: [
          { number: 6, name: "Josu\u00e9", chapters: 24 },
          { number: 7, name: "Jueces", chapters: 21 },
          { number: 8, name: "Rut", chapters: 4 },
          { number: 9, name: "1 Samuel", chapters: 31 },
          { number: 10, name: "2 Samuel", chapters: 24 },
          { number: 11, name: "1 Reyes", chapters: 22 },
          { number: 12, name: "2 Reyes", chapters: 25 },
          { number: 13, name: "1 Cr\u00f3nicas", chapters: 29 },
          { number: 14, name: "2 Cr\u00f3nicas", chapters: 36 },
          { number: 15, name: "Esdras", chapters: 9 },
          { number: 16, name: "Nehem\u00edas", chapters: 13 },
          { number: 17, name: "Ester", chapters: 10 },
        ],
      },
      {
        name: "Libros Po\u00e9ticos (Sapienciales)",
        books: [
          { number: 18, name: "Job", chapters: 42 },
          { number: 19, name: "Salmos", chapters: 149 },
          { number: 20, name: "Proverbios", chapters: 31 },
          { number: 21, name: "Eclesiast\u00e9s", chapters: 11 },
          { number: 22, name: "Cantares", chapters: 6 },
        ],
      },
      {
        name: "Profetas Mayores",
        books: [
          { number: 23, name: "Isa\u00edas", chapters: 66 },
          { number: 24, name: "Jerem\u00edas", chapters: 52 },
          { number: 25, name: "Lamentaciones", chapters: 5 },
          { number: 26, name: "Ezequiel", chapters: 47 },
          { number: 27, name: "Daniel", chapters: 12 },
        ],
      },
      {
        name: "Profetas Menores",
        books: [
          { number: 28, name: "Oseas", chapters: 14 },
          { number: 29, name: "Joel", chapters: 3 },
          { number: 30, name: "Am\u00f3s", chapters: 9 },
          { number: 31, name: "Abd\u00edas", chapters: 1 },
          { number: 32, name: "Jon\u00e1s", chapters: 4 },
          { number: 33, name: "Miqueas", chapters: 7 },
          { number: 34, name: "Nah\u00fam", chapters: 3 },
          { number: 35, name: "Habacuc", chapters: 3 },
          { number: 36, name: "Sofon\u00edas", chapters: 3 },
          { number: 37, name: "Hageo", chapters: 2 },
          { number: 38, name: "Zacar\u00edas", chapters: 14 },
          { number: 39, name: "Malaqu\u00edas", chapters: 4 },
        ],
      },
    ],
  },
  {
    name: "Nuevo Testamento",
    sections: [
      {
        name: "Evangelios",
        books: [
          { number: 40, name: "Mateo", chapters: 28 },
          { number: 41, name: "Marcos", chapters: 16 },
          { number: 42, name: "Lucas", chapters: 24 },
          { number: 43, name: "Juan", chapters: 20 },
        ],
      },
      {
        name: "Historia",
        books: [
          { number: 44, name: "Hechos", chapters: 28 },
        ],
      },
      {
        name: "Ep\u00edstolas Paulinas",
        books: [
          { number: 45, name: "Romanos", chapters: 16 },
          { number: 46, name: "1 Corintios", chapters: 29 },
          { number: 47, name: "2 Corintios", chapters: 13 },
          { number: 48, name: "G\u00e1latas", chapters: 6 },
          { number: 49, name: "Efesios", chapters: 6 },
          { number: 50, name: "Filipenses", chapters: 4 },
          { number: 51, name: "Colosenses", chapters: 4 },
          { number: 52, name: "1 Tesalonicenses", chapters: 5 },
          { number: 53, name: "2 Tesalonicenses", chapters: 3 },
          { number: 54, name: "1 Timoteo", chapters: 6 },
          { number: 55, name: "2 Timoteo", chapters: 4 },
          { number: 56, name: "Tito", chapters: 3 },
          { number: 57, name: "Filem\u00f3n", chapters: 1 },
        ],
      },
      {
        name: "Ep\u00edstolas Generales",
        books: [
          { number: 58, name: "Hebreos", chapters: 13 },
          { number: 59, name: "Santiago", chapters: 5 },
          { number: 60, name: "1 Pedro", chapters: 5 },
          { number: 61, name: "2 Pedro", chapters: 3 },
          { number: 62, name: "1 Juan", chapters: 5 },
          { number: 63, name: "2 Juan", chapters: 1 },
          { number: 64, name: "3 Juan", chapters: 1 },
          { number: 65, name: "Judas", chapters: 1 },
        ],
      },
      {
        name: "Profec\u00eda",
        books: [
          { number: 66, name: "Apocalipsis", chapters: 22 },
        ],
      },
    ],
  },
];

export function findAudioBook(bookNumber: number): AudioBook | null {
  for (const t of AUDIO_TESTAMENTS) {
    for (const s of t.sections) {
      const found = s.books.find((b) => b.number === bookNumber);
      if (found) return found;
    }
  }
  return null;
}
