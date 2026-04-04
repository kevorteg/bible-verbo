
// La API Key ahora se carga desde variables de entorno por seguridad
export const API_BIBLE_KEY = import.meta.env.VITE_API_BIBLE_KEY || "";
export const DEFAULT_BIBLE_ID = "592420522e16049f-01"; // Reina Valera 1909

export const BIBLE_VERSIONS = [
  { name: "Reina Valera 1909", id: "592420522e16049f-01" },
  { name: "Nueva Traducción Viviente", id: "826f63861180e056-01" },
  { name: "New International Version (NIV)", id: "78a9f6124f344018-01" },
  { name: "New American Standard Bible (NASB)", id: "b8ee27bcd1cae43a-01" }
];

export const THEME_CLASSES = {
  dark: 'bg-[#0a192f] text-neutral-100 border-blue-900/30',
  light: 'bg-neutral-50 text-neutral-900 border-neutral-200',
  sepia: 'bg-[#f4ecd8] text-[#5b4636] border-[#e2d5b6]'
};


import logoMj from './assets/logo2.png';

export const MJ_WEBSITE_URL = "#";
export const MJ_LOGO_URL = logoMj;
