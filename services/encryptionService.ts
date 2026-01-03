
import CryptoJS from 'crypto-js';

// NOTA DE SEGURIDAD:
// En producción, esta llave debe estar en variables de entorno (.env) y NO en el código.
// Si pierdes esta llave, los nombres de los usuarios serán irrecuperables.
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'VERBO_BIBLE_SECRET_KEY_AES_256'; 

/**
 * Cifra texto plano.
 * Input: "Kevin" -> Output: "U2FsdGVkX1..."
 */
export const encryptData = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * Descifra texto.
 * Input: "U2FsdGVkX1..." -> Output: "Kevin"
 */
export const decryptData = (cipherText: string): string => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || '';
  } catch (e) {
    console.error("Error decrypting data", e);
    return '';
  }
};
