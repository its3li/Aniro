
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/components/providers/settings-provider';
import { Toaster } from "@/components/ui/toaster";
import { AudioPlayerProvider } from '@/components/providers/audio-player-provider';
import { GlobalPlayer } from '@/components/global-player';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { AppContent } from '@/components/providers/app-content';
import { OnboardingGate } from '@/components/onboarding-gate';

export const metadata: Metadata = {
  title: 'Aniro',
  description: 'An elegant Islamic lifestyle application.',
};

import { AzanPlayer } from '@/components/providers/azan-player';
import { UpdateDialog } from '@/components/update-dialog';

const quranFont = localFont({
  src: '../../public/fonts/naskh.woff2',
  variable: '--font-quran-local',
  display: 'swap',
});
const uiFont = localFont({ src: '../../public/fonts/manrope.ttf', variable: '--font-ui', display: 'swap' });
const arabicUiFont = localFont({ src: '../../public/fonts/ui-arabic.ttf', variable: '--font-ui-arabic', display: 'swap' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Blocking script: apply dark mode BEFORE React hydration to prevent white flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('ui-theme');
              if (!theme) {
                var appSettings = localStorage.getItem('app-settings');
                if (appSettings) {
                  var parsed = JSON.parse(appSettings);
                  theme = parsed.appTheme || 'dark';
                }
              }
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) || theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}} />
      </head>
      <body className={cn(quranFont.variable, uiFont.variable, arabicUiFont.variable, 'font-body antialiased bg-background min-h-screen')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <LoadingProvider>
              <AudioPlayerProvider>
                  <AppContent>
                    <div className="app-shell fixed inset-0 -z-10" aria-hidden="true" />
                    <a href="#app-main" className="skip-link">Skip to content</a>
                    <main id="app-main" className="app-main safe-area-top">
                      {children}
                    </main>
                    <GlobalPlayer />
                    <AzanPlayer />
                    <OnboardingGate />
                    <Toaster />
                    <UpdateDialog />
                  </AppContent>
              </AudioPlayerProvider>
            </LoadingProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
