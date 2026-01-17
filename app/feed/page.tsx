import { FeedPage } from '@/components/FeedPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Memeverse – Trending Memes & Reels, Latest Meme Feed',
  description:
    'Explore trending memes, viral reels, and funny videos on Memeverse.',
  keywords: ['memes', 'reels', 'funny videos', 'memeverse'],
  openGraph: {
    title: 'Latest Meme Feed – Memeverse',
    description: 'Browse the latest viral meme feed.',
    url: 'https://memeverse.in/feed',
  },
};

async function getFeed() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE;

  if (!baseUrl) {
    console.error('NEXT_PUBLIC_BACKEND_API_BASE is not defined');
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/feed?page=1`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Feed API failed:', res.status);
      return [];
    }

    const json = await res.json();

    // ✅ ALWAYS return an array
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.error('Feed fetch error:', err);
    return [];
  }
}

export default async function Page() {
  const initialPosts = await getFeed();

  return <FeedPage initialPosts={initialPosts} />;
}
