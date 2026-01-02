import type {Metadata, Viewport} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseClientProvider } from '@/supabase';
import { SessionTimeoutProvider } from '@/components/session-timeout-provider';
import { ThemeProvider } from '@/components/theme-provider';


export const metadata: Metadata = {
  title: 'Virtuality',
  description: 'An interactive 360 virtual tour of different places.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased bg-background')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseClientProvider>
            <SessionTimeoutProvider>
              <div className="relative flex min-h-screen w-full flex-col">
                {children}
              </div>
            </SessionTimeoutProvider>
            <Toaster />
          </SupabaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
