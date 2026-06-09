
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

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
