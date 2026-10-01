import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Toaster } from 'sonner';

const satoshi = localFont({
  src: [
    {
      path: '../fonts/satoshi/fonts/Satoshi-Variable.woff2',
      style: 'normal',
    },
    {
      path: '../fonts/satoshi/fonts/Satoshi-VariableItalic.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Club DCC Camu | Attendance & Analytics Portal',
  description: 'Bennett University Developers & Creators Club (DCC) Attendance System',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${satoshi.variable} ${jetbrainsMono.variable} font-sans min-h-full bg-background text-foreground flex flex-col antialiased transition-colors duration-150`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex-1">
              {children}
            </div>
            <MobileNav />
            <CommandPalette />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
