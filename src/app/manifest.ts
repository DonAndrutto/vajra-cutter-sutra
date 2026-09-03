import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vajra-Cutter Sutra Reader',
    short_name: 'Vajracchedikā',
    description:
      'Read and recite the Vajracchedikā Prajñāpāramitā Sūtra in Sanskrit, Tibetan and English — available offline.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#121214',
    theme_color: '#121214',
    lang: 'en',
    dir: 'ltr',
    categories: ['books', 'education', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Android reshapes maskable icons to the launcher's own silhouette and
      // may crop everything outside the inner 80%; these keep the plaque clear
      // of that crop instead of letting the gold frame be shaved off.
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
