
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/components/providers/settings-provider';
import { Toaster } from "@/components/ui/toaster";
import { AudioPlayerProvider } from '@/components/providers/audio-player-provider';
import { GlobalPlayer } from '@/components/global-player';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { AppContent } from '@/components/providers/app-content';
import { SilentDownloadProvider } from '@/components/providers/silent-download-provider';

export const metadata: Metadata = {
  title: 'Aniro',
  description: 'An elegant Islamic lifestyle application.',
};

import { AzanPlayer } from '@/components/providers/azan-player';
import { UpdateDialog } from '@/components/update-dialog';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          @font-face {
            font-family: 'hafs';
            src: url('/fonts/naskh.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          .quran-text {
            font-family: 'hafs', 'Noto Naskh Arabic', 'Scheherazade New', serif;
            text-align: right;
            direction: rtl;
            line-height: 2.5;
          }
        `}</style>
      </head>
      <body className={cn('font-body antialiased bg-background min-h-screen')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <LoadingProvider>
              <AudioPlayerProvider>
                <SilentDownloadProvider>
                  <AppContent>
                    <main className="pb-[4.5rem] safe-area-top" style={{ paddingBottom: 'calc(4.5rem + var(--safe-area-bottom, 0px))' }}>
                      {children}
                    </main>
                    <GlobalPlayer />
                    <AzanPlayer />
                    <Toaster />
                    <UpdateDialog />
                  </AppContent>
                </SilentDownloadProvider>
              </AudioPlayerProvider>
            </LoadingProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
