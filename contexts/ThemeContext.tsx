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

const lightColors: ThemeColors = {
  bg: '#FFF5F0',
  surface: '#FFF5F0',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#EBF3FA',
  surfaceContainer: '#D6E6F4',
  surfaceHigh: '#C0DAEF',
  surfaceHighest: '#A8CBE8',
  primary: '#449BD1',
  primaryContainer: '#D6ECFA',
  primaryShadow: '#31729A',
  secondary: '#473458',
  secondaryContainer: '#E1D6EC',
  secondaryShadow: '#2d1f3b',
  tertiary: '#F58634',
  tertiaryContainer: '#FDE0CC',
  tertiaryShadow: '#C86721',
  onSurface: '#1A0E1C',
  onSurfaceVariant: '#564337',
  outline: '#897265',
  outlineVariant: '#DDBFAE',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#003354',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#2d1f3b',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#5C2A00',
};

const darkColors: ThemeColors = {
  bg: '#1A0E1C',
  surface: '#1A0E1C',
  surfaceLowest: '#2A1E2C',
  surfaceLow: '#1A2A3C',
  surfaceContainer: '#2A3A4C',
  surfaceHigh: '#3A4A5C',
  surfaceHighest: '#4A5A6C',
  primary: '#449BD1',
  primaryContainer: '#003354',
  primaryShadow: '#31729A',
  secondary: '#B29AC5',
  secondaryContainer: '#2d1f3b',
  secondaryShadow: '#6A4E8C',
  tertiary: '#F58634',
  tertiaryContainer: '#5C2A00',
  tertiaryShadow: '#C86721',
  onSurface: '#FFE8DC',
  onSurfaceVariant: '#DDBFAE',
  outline: '#897265',
  outlineVariant: '#5A4E5C',
  onPrimary: '#1A0E1C',
  onPrimaryContainer: '#D6ECFA',
  onSecondary: '#1A0E1C',
  onSecondaryContainer: '#E1D6EC',
  onTertiary: '#1A0E1C',
  onTertiaryContainer: '#FDE0CC',
};

const sepiaColors: ThemeColors = {
  bg: '#F4ECD8',
  surface: '#F4ECD8',
  surfaceLowest: '#FCF5E8',
  surfaceLow: '#E8ECF0',
  surfaceContainer: '#D0DCE8',
  surfaceHigh: '#B8CCE0',
  surfaceHighest: '#A0BCD8',
  primary: '#5A8AAA',
  primaryContainer: '#D0E0F0',
  primaryShadow: '#3A6A8A',
  secondary: '#6A4A3A',
  secondaryContainer: '#E0D0C0',
  secondaryShadow: '#4A2A1A',
  tertiary: '#B8772E',
  tertiaryContainer: '#F0DCC0',
  tertiaryShadow: '#8A5518',
  onSurface: '#2A1A0E',
  onSurfaceVariant: '#5A4A3A',
  outline: '#8A7A6A',
  outlineVariant: '#D0C0B0',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1A3A5A',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#2A1A0E',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#3A2000',
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
