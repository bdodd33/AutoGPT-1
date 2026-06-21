export const FontFamily = {
  regular: 'Cormorant_400Regular',
  medium: 'Cormorant_500Medium',
  semiBold: 'Cormorant_600SemiBold',
  bold: 'Cormorant_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansBold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30, display: 38,
} as const;

export const LineHeight = {
  tight: 1.2, normal: 1.5, relaxed: 1.75, loose: 2.0,
} as const;

export const LetterSpacing = {
  tight: -0.5, normal: 0, wide: 0.5, wider: 1.0, widest: 2.0,
} as const;
