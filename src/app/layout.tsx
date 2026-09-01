import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { WatchlistProvider } from '@/context/WatchlistContext';

export const metadata: Metadata = {
  title: 'SigmaPulse — Institutional Quantitative Trading Terminal & Derivatives Intelligence',
  description: 'Wall Street institutional terminal combining real-time catalyst crawlers, quantitative event backtesting, and Greek-calibrated options strategy generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#06090e] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-black">
        <ThemeProvider>
          <WatchlistProvider>
            {children}
          </WatchlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
