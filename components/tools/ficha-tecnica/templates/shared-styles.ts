// Extractable — only depends on @react-pdf/renderer
import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;

  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: '/fonts/Montserrat-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Montserrat-SemiBold.ttf', fontWeight: 600 },
      { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 700 },
    ],
  });
}

export const colors = {
  navy: '#1a2744',
  navyLight: '#2a3a5c',
  orange: '#e8792b',
  orangeLight: '#f5a623',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  dark: '#1f2937',
  darkOverlay: 'rgba(0, 0, 0, 0.55)',
};
