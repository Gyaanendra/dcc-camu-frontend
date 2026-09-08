import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MobileNav } from '@/components/layout/MobileNav';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Club DCC Camu | Attendance & Analytics Portal',
  description: 'Bennett University Developers & Creators Club (DCC) Attendance System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-full bg-background text-foreground flex flex-col antialiased transition-colors duration-150`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex-1">
              {children}
            </div>
            <MobileNav />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
