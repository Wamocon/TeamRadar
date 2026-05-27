import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { FloatingChat } from '@/components/ui/FloatingChat';
import './globals.css';

export const metadata: Metadata = {
  title: 'TeamRadar – Verfügbarkeit im Blick',
  description: 'Mitarbeiter-Verfügbarkeit visualisieren und verwalten',
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.png?v=2', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png?v=2', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="h-screen overflow-hidden flex flex-col">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <FloatingChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
