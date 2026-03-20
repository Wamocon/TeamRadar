import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'TeamRadar – Verfügbarkeit im Blick',
  description: 'Mitarbeiter-Verfügbarkeit visualisieren und verwalten',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
