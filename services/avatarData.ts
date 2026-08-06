export interface AvatarOption {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const biblicalAvatars: AvatarOption[] = [
  { id: 'moses', name: 'Moisés', description: 'El libertador de Israel', color: '#449BD1', icon: 'MT' },
  { id: 'david', name: 'David', description: 'El rey conforme al corazon de Dios', color: '#F58634', icon: 'DV' },
  { id: 'abraham', name: 'Abraham', description: 'Padre de la fe', color: '#473458', icon: 'AB' },
  { id: 'sarah', name: 'Sara', description: 'Madre de naciones', color: '#E8A0C8', icon: 'SR' },
  { id: 'joshua', name: 'Josue', description: 'El conquistador valiente', color: '#2E7D32', icon: 'JS' },
  { id: 'ruth', name: 'Rut', description: 'La lealtad personificada', color: '#D4A574', icon: 'RT' },
  { id: 'samuel', name: 'Samuel', description: 'El profeta que Dios llamo', color: '#5B8DEF', icon: 'SM' },
  { id: 'esther', name: 'Ester', description: 'Para tal tiempo como este', color: '#C92A5E', icon: 'ES' },
  { id: 'isaiah', name: 'Isaías', description: 'El profeta de la esperanza', color: '#4A90A4', icon: 'IS' },
  { id: 'jeremiah', name: 'Jeremias', description: 'El profeta de la restauracion', color: '#8B4513', icon: 'JR' },
  { id: 'daniel', name: 'Daniel', description: 'El hombre de integridad', color: '#2C3E50', icon: 'DN' },
  { id: 'peter', name: 'Pedro', description: 'La roca de la iglesia', color: '#4477AA', icon: 'PD' },
  { id: 'paul', name: 'Pablo', description: 'El apostol de los gentiles', color: '#AA4444', icon: 'PL' },
  { id: 'john', name: 'Juan', description: 'El discipulo amado', color: '#446688', icon: 'JN' },
  { id: 'mary', name: 'Maria', description: 'Madre de Jesus', color: '#88AACC', icon: 'MY' },
  { id: 'luke', name: 'Lucas', description: 'El medico evangelista', color: '#669966', icon: 'LK' },
  { id: 'noah', name: 'Noe', description: 'El constructor del arca', color: '#6B4226', icon: 'NH' },
  { id: 'jonah', name: 'Jonas', description: 'El profeta misionero', color: '#3D7A7A', icon: 'JN' },
  { id: 'deborah', name: 'Debora', description: 'La jueza profetisa', color: '#996688', icon: 'DB' },
  { id: 'timothy', name: 'Timoteo', description: 'El joven lider', color: '#5577AA', icon: 'TM' },
];

export function getAvatarById(id: string): AvatarOption | undefined {
  return biblicalAvatars.find(a => a.id === id);
}

export function getAvatarByName(name: string): AvatarOption | undefined {
  return biblicalAvatars.find(a => a.name.toLowerCase() === name.toLowerCase());
}
