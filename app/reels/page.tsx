import { ReelsGridPage } from '@/components/ReelsGridPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Reels – Memeverse',
  description:
    'Watch trending reels and viral short videos on Memeverse.',
  openGraph: {
    title: 'Trending Reels – Memeverse',
    description: 'Explore viral reels from around the world.',
    url: 'https://memeverse.in/reels',
  },
};

async function getReels() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not defined');
  }

  const res = await fetch(`${baseUrl}/api/feed?page=1`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reels');
  }

  const posts = await res.json();

  // ✅ Filter only video posts on server
  return posts.filter((post: any) => post.type === 'video');
}

export default async function Page() {
  const initialPosts = await getReels();
  return <ReelsGridPage initialPosts={initialPosts} />;
}
