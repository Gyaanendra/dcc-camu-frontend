import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MobileNav } from '@/components/layout/MobileNav';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
      <body className={`${inter.variable} font-sans min-h-full bg-background text-foreground flex flex-col antialiased transition-colors duration-150`}>
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
