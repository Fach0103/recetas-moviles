// src/theme/typography.js
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const Typography = {
  // Tamaños
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,

  // Pesos
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Alturas de línea
  lineHeightSm: 18,
  lineHeightMd: 22,
  lineHeightLg: 26,
  lineHeightXl: 30,

  fontFamily,
};

export default Typography;
