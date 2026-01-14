import { FeedPage } from '@/components/FeedPage';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Memeverse – Trending Memes & Reels, Latest Meme Feed",
  description:
    "Explore trending memes, viral reels, and funny videos on Memeverse.Browse the latest meme feed featuring viral videos and trending content.",
  keywords: ["memes", "reels", "funny videos", "memeverse"],
   openGraph: {
    title: "Latest Meme Feed – Memeverse",
    description: "Browse the latest viral meme feed.",
    url: "https://memeverse.in/feed",
  },
};


async function getFeed() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not defined');
  }

  const res = await fetch(`${baseUrl}/api/feed?page=1`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch feed');
  }

  return res.json();
}

export default async function Page() {
  const initialPosts = await getFeed();
  return <FeedPage initialPosts={initialPosts} />;
}
