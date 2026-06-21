import { Colors } from './colors';
import { FontFamily, FontSize, LineHeight, LetterSpacing } from './typography';
import { Spacing, Radius, Shadow } from './spacing';

export const Theme = {
  colors: Colors,
  fonts: FontFamily,
  fontSize: FontSize,
  lineHeight: LineHeight,
  letterSpacing: LetterSpacing,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,
} as const;

export type Theme = typeof Theme;
export { Colors, FontFamily, FontSize, LineHeight, LetterSpacing, Spacing, Radius, Shadow };
