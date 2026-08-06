import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'VERBO_BIBLE_SECRET_KEY_AES_256';

export const encryptData = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptData = (cipherText: string): string => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || '';
  } catch {
    return '';
  }
};
