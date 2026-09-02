import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider, useAppContext } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import ClientLayout from './client-layout';
import ServiceWorker from '@/components/service-worker';

export const metadata: Metadata = {
  title: 'Vajra-Cutter Sutra Reader',
  description: 'An application for reading and studying the Vajracchedika Sutra.',
  applicationName: 'Vajracchedikā',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Vajracchedikā',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0a09',
};

/**
 * Chrome fires beforeinstallprompt as soon as the page qualifies, which can be
 * before React hydrates. Stashing the event here keeps the install button from
 * missing it; see src/components/install-app-button.tsx.
 */
const captureInstallPrompt = `
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  window.__vcsInstallPrompt = event;
  window.dispatchEvent(new Event('vcs:installprompt'));
});
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&family=Inter:wght@400;500;600;700&family=Jomolhari&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
      </head>
      <body>
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
