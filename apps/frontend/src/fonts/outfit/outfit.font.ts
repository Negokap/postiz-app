import localFont from 'next/font/local';

// Setjoo brand font (ADR 0004), self-hosted. Variable weight 100-900.
export const outfit = localFont({
  src: [{ path: './Outfit.ttf', weight: '100 900', style: 'normal' }],
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  variable: '--font-outfit',
});
