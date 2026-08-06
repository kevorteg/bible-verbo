import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeColors {
  bg: string;
  surface: string;
  surfaceLowest: string;
  surfaceLow: string;
  surfaceContainer: string;
  surfaceHigh: string;
  surfaceHighest: string;
  primary: string;
  primaryContainer: string;
  primaryShadow: string;
  secondary: string;
  secondaryContainer: string;
  secondaryShadow: string;
  tertiary: string;
  tertiaryContainer: string;
  tertiaryShadow: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  onTertiary: string;
  onTertiaryContainer: string;
}

// Duolingo-inspired palette: Feather Green primary, Macaw Blue for reading,
// Fox Orange for streaks/gems. Neutrals are Duolingo's snow / swan grays.
const lightColors: ThemeColors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F7F7F7',
  surfaceContainer: '#F0F0F0',
  surfaceHigh: '#E5E5E5',
  surfaceHighest: '#D8D8D8',
  primary: '#58CC02',
  primaryContainer: '#D7FFB8',
  primaryShadow: '#58A700',
  secondary: '#1CB0F6',
  secondaryContainer: '#DDF4FF',
  secondaryShadow: '#1899D6',
  tertiary: '#FF9600',
  tertiaryContainer: '#FFF0DB',
  tertiaryShadow: '#E08600',
  onSurface: '#3C3C3C',
  onSurfaceVariant: '#777777',
  outline: '#E5E5E5',
  outlineVariant: '#E5E5E5',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#3C8000',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#0A6DA0',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#9A5A00',
};

const darkColors: ThemeColors = {
  bg: '#131F24',
  surface: '#131F24',
  surfaceLowest: '#202F36',
  surfaceLow: '#1B2A31',
  surfaceContainer: '#26363D',
  surfaceHigh: '#37464F',
  surfaceHighest: '#45565F',
  primary: '#58CC02',
  primaryContainer: '#2B4A16',
  primaryShadow: '#4B9E00',
  secondary: '#1CB0F6',
  secondaryContainer: '#14384A',
  secondaryShadow: '#1899D6',
  tertiary: '#FF9600',
  tertiaryContainer: '#4A3510',
  tertiaryShadow: '#CC7800',
  onSurface: '#F1F7FB',
  onSurfaceVariant: '#9AABB3',
  outline: '#37464F',
  outlineVariant: '#37464F',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#B8F58A',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#9FDCFF',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#FFD199',
};

const sepiaColors: ThemeColors = {
  bg: '#F4ECD8',
  surface: '#F4ECD8',
  surfaceLowest: '#FCF7EA',
  surfaceLow: '#EFE6CE',
  surfaceContainer: '#E7DBBE',
  surfaceHigh: '#DCCFAC',
  surfaceHighest: '#CFC099',
  primary: '#58A700',
  primaryContainer: '#DBEFB8',
  primaryShadow: '#3E7A00',
  secondary: '#1899D6',
  secondaryContainer: '#CFE7F2',
  secondaryShadow: '#0F7AB0',
  tertiary: '#E0870A',
  tertiaryContainer: '#F6E4C2',
  tertiaryShadow: '#B36A00',
  onSurface: '#3A2E1A',
  onSurfaceVariant: '#7A6A4E',
  outline: '#D0C0A0',
  outlineVariant: '#D0C0A0',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#3E7A00',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#0F7AB0',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#9A5A00',
};

const themes: Record<Theme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
  sepia: sepiaColors,
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightColors,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  const value = useMemo(() => ({
    theme,
    colors: themes[theme],
    setTheme,
    toggleTheme: () => {
      setTheme(prev => {
        const order: Theme[] = ['light', 'dark', 'sepia'];
        const idx = order.indexOf(prev);
        return order[(idx + 1) % order.length];
      });
    },
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
