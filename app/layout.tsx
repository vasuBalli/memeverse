import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/* ===============================
   ✅ SEO METADATA
================================ */

export const metadata: Metadata = {
  metadataBase: new URL('https://memeverse.in'),

  title: {
    default: 'Memeverse – Viral Memes, Reels & Trending Videos',
    template: '%s | Memeverse',
  },

  description:
    'Memeverse is India’s fastest-growing meme platform featuring trending memes, viral reels, and funny videos updated daily.',

  applicationName: 'Memeverse',

  keywords: [
    'memes',
    'viral memes',
    'reels',
    'funny videos',
    'trending memes',
    'instagram reels',
    'indian memes',
  ],

  authors: [{ name: 'Memeverse Team', url: 'https://memeverse.in' }],
  creator: 'Memeverse',
  publisher: 'Memeverse',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'Memeverse – Viral Memes & Trending Reels',
    description:
      'Discover trending memes, viral reels, and internet-breaking funny videos every day on Memeverse.',
    url: '/',
    siteName: 'Memeverse',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Memeverse – Viral Memes & Reels',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@memeverse',
    creator: '@memeverse',
    title: 'Memeverse – Viral Memes & Trending Reels',
    description:
      'Explore trending memes, viral reels, and funny videos — updated daily.',
    images: ['/og-default.jpg'],
  },

  category: 'entertainment',
};

/* ===============================
   ✅ VIEWPORT
================================ */

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/* ===============================
   ✅ ROOT LAYOUT
================================ */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* ✅ PWA / SEO extras */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* ✅ Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* ✅ Theme color */}
        <meta name="theme-color" content="#0A0A0F" />

        {/* ✅ Google site verification */}
        <meta name="google-site-verification" content="xh5eburiAnmwOjnxnsk7R3PXMI7_ii9WeSQ8UvccTRk" />
      </head>

      <body className="bg-[#0A0A0F] text-white antialiased">
        <Providers>
          <Header />
          <main>{children}</main>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
