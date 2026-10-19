import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NexVerze Studio',
    short_name: 'Studio',
    description: 'AI Video Generation Platform with Quality Lock',
    start_url: '/studio',
    display: 'standalone',
    background_color: '#0a0a12',
    theme_color: '#0a0a12',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
