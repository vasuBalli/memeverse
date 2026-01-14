import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Trending Memes & Reels",
  description:
    "Watch trending memes, viral reels, and funny videos curated daily on Memeverse.",
    alternates: {
    canonical: "https://memeverse.in/feed",
  },
     openGraph: {
    title: "Trending Memes & Reels – Memeverse",
    description:
      "Watch trending memes, viral reels, and funny videos curated daily.",
    url: "https://memeverse.in",
  },
};
export default function Home() {
  redirect('/feed');
}
