import { ReelsViewer } from '@/components/ReelsViewer';
import { Post } from '@/data/mockData';

interface PageProps {
  params: { id: string };
}

async function getInitialReels(id: string): Promise<{
  posts: Post[];
  startIndex: number;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const res = await fetch(`${baseUrl}/api/feed?page=1`, {
    cache: 'no-store',
  });

  const posts: Post[] = await res.json();
  const videoPosts = posts.filter(p => p.type === 'video');

  const startIndex = Math.max(
    0,
    videoPosts.findIndex(p => p.id === id)
  );

  return { posts: videoPosts, startIndex };
}

export default async function Page({ params }: PageProps) {
  const { posts, startIndex } = await getInitialReels(params.id);

  return (
    <ReelsViewer
      initialPosts={posts}
      initialIndex={startIndex}
    />
  );
}
