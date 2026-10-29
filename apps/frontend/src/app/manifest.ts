import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Setjoo Social',
    short_name: 'Setjoo Social',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#ED1C24',
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
  };
}
