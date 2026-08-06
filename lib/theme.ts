export const colors = {
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
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 40,
  '2xl': 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 32,
  xl: 48,
  full: 9999,
} as const;

export const chunkyShadow = {
  default: {
    shadowColor: 'rgba(0,0,0,0.10)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  primary: {
    shadowColor: '#31729A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 8,
  },
  secondary: {
    shadowColor: '#2d1f3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 8,
  },
  tertiary: {
    shadowColor: '#C86721',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 8,
  },
} as const;

export const fonts = {
  heading: 'BricolageGrotesque',
  body: 'PlusJakartaSans',
  label: 'SpaceGrotesk',
} as const;
