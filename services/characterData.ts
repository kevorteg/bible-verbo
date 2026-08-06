export interface Character {
  id: string;
  name: string;
  asset: string;
  color: string;
  role: 'guide' | 'biblical' | 'symbolic';
  description: string;
}

export type CharacterReaction = 'idle' | 'happy' | 'celebrate' | 'encourage' | 'thinking' | 'sad' | 'surprised';

export type CharacterSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CharacterConfig {
  character: Character;
  reaction: CharacterReaction;
  message?: string;
}

const CHARACTERS: Character[] = [
  {
    id: 'guide',
    name: 'Pastor Guia',
    asset: require('../assets/characters/guide.png'),
    color: '#473458',
    role: 'guide',
    description: 'Tu guia espiritual en Verbo',
  },
  {
    id: 'moses',
    name: 'Moises',
    asset: require('../assets/characters/moses.png'),
    color: '#449BD1',
    role: 'biblical',
    description: 'El libertador de Israel',
  },
  {
    id: 'david1',
    name: 'David',
    asset: require('../assets/characters/david1.png'),
    color: '#F58634',
    role: 'biblical',
    description: 'El rey conforme al corazon de Dios',
  },
  {
    id: 'abraham',
    name: 'Abraham',
    asset: require('../assets/characters/abraham.png'),
    color: '#473458',
    role: 'biblical',
    description: 'Padre de la fe',
  },
  {
    id: 'esther',
    name: 'Ester',
    asset: require('../assets/characters/esther.png'),
    color: '#C92A5E',
    role: 'biblical',
    description: 'Para tal tiempo como este',
  },
  {
    id: 'paul',
    name: 'Pablo',
    asset: require('../assets/characters/paul.png'),
    color: '#AA4444',
    role: 'biblical',
    description: 'El apostol de los gentiles',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    asset: require('../assets/characters/daniel.png'),
    color: '#2C3E50',
    role: 'biblical',
    description: 'El hombre de integridad',
  },
  {
    id: 'noah',
    name: 'Noe',
    asset: require('../assets/characters/noah.png'),
    color: '#6B4226',
    role: 'biblical',
    description: 'El constructor del arca',
  },
  {
    id: 'solomon1',
    name: 'Salomon',
    asset: require('../assets/characters/solomon1.png'),
    color: '#D4A574',
    role: 'biblical',
    description: 'El rey sabio',
  },
  {
    id: 'jonah',
    name: 'Jonas',
    asset: require('../assets/characters/jonah.png'),
    color: '#3D7A7A',
    role: 'biblical',
    description: 'El profeta misionero',
  },
  {
    id: 'gideon',
    name: 'Gedeon',
    asset: require('../assets/characters/gideon.png'),
    color: '#5B8DEF',
    role: 'biblical',
    description: 'El guerrero valiente',
  },
  {
    id: 'joseph',
    name: 'Jose',
    asset: require('../assets/characters/joseph.png'),
    color: '#E8A0C8',
    role: 'biblical',
    description: 'El soñador',
  },
  {
    id: 'ruth',
    name: 'Rut',
    asset: require('../assets/characters/ruth.png'),
    color: '#D4A574',
    role: 'biblical',
    description: 'La lealtad personificada',
  },
  {
    id: 'timothy',
    name: 'Timoteo',
    asset: require('../assets/characters/timothy.png'),
    color: '#5577AA',
    role: 'biblical',
    description: 'El joven lider',
  },
  {
    id: 'mary',
    name: 'Maria',
    asset: require('../assets/characters/mary.png'),
    color: '#88AACC',
    role: 'biblical',
    description: 'Madre de Jesus',
  },
  {
    id: 'isaiah1',
    name: 'Isaias',
    asset: require('../assets/characters/isaiah1.png'),
    color: '#4A90A4',
    role: 'biblical',
    description: 'El profeta de la esperanza',
  },
];

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export function getGuide(): Character {
  return CHARACTERS[0];
}

export function getRandomCharacter(): Character {
  const biblical = CHARACTERS.filter(c => c.role === 'biblical');
  return biblical[Math.floor(Math.random() * biblical.length)];
}

export function getCharactersByRole(role: Character['role']): Character[] {
  return CHARACTERS.filter(c => c.role === role);
}

export function getAllCharacters(): Character[] {
  return [...CHARACTERS];
}

export const REACTION_MESSAGES: Record<CharacterReaction, string[]> = {
  idle: ['Sigue adelante!', 'Dios te bendice', 'La Palabra te espera'],
  happy: ['Bien hecho!', 'Excelente trabajo!', 'Sigue asi!'],
  celebrate: ['Gloria a Dios!', 'Felicidades!', 'Que bendicion!'],
  encourage: ['Tu puedes!', 'No te rindas!', 'Un paso a la vez'],
  thinking: ['En que libro leeremos hoy?', 'Que pasaje te gustaria explorar?'],
  sad: ['No te preocupes, intentalo de nuevo', 'Todos caemos, Dios levanta'],
  surprised: ['Wow! Increible!', 'Dios es grande!'],
};
