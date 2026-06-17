export const Colors = {
  navy: {
    DEFAULT: '#0D1B2A',
    light: '#1A2F45',
    dark: '#080F16',
    card: '#122338',
  },
  gold: {
    DEFAULT: '#C9A84C',
    light: '#E2C97E',
    dark: '#9E7A2E',
  },
  rose: {
    DEFAULT: '#E8B4B8',
    light: '#F5D5D8',
    dark: '#C9848A',
  },
  white: '#FFFFFF',
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
} as const;

export const Typography = {
  display: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.gold.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: Colors.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
