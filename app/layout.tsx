import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';
import '@/styles/globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Memeverse – Viral Memes & Reels',
    template: '%s | Memeverse',
  },
  description:
    'Memeverse is a platform to explore trending memes, viral reels, and funny videos updated daily.',
  keywords: ['memes', 'reels', 'viral videos', 'funny memes'],
  alternates: {
    canonical: 'https://memeverse.in',
  },
  openGraph: {
    siteName: 'Memeverse',
    type: 'website',
    locale: 'en_IN',
    url: 'https://memeverse.in',
    images: [
      {
        url: 'https://memeverse.in/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Memeverse – Viral Memes & Reels',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@memeverse',
  },
};

// ✅ MUST be separate in App Router
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0F] text-white">
        <Providers>
          <Header />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
