
import type {Metadata} from 'next';
import './globals.css';
import { AppProvider, useAppContext } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import ClientLayout from './client-layout';

export const metadata: Metadata = {
  title: 'Vajra-Cutter Sutra Reader',
  description: 'An application for reading and studying the Vajracchedika Sutra.',
};

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
      </head>
      <body>
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
