'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

import { ReelsGridTile } from './ReelsGridTile';
import { ReelsGridSkeleton } from './ReelsGridSkeleton';
import { UploadFAB } from './UploadFAB';

import { Post } from '@/data/mockData';

interface ReelsGridPageProps {
  initialPosts: Post[];
}

export function ReelsGridPage({ initialPosts }: ReelsGridPageProps) {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(2); // page 1 already fetched on server
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);

  /* ------------------------------------------------------------ */
  /* Load more reels (direct fetch, no helper)                      */
  /* ------------------------------------------------------------ */

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/feed?page=${page}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('Feed fetch failed');

      const feed: Post[] = await res.json();

      const videoPosts = feed.filter(
        (post) => post.type === 'video'
      );

      if (videoPosts.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts(prev => [...prev, ...videoPosts]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load reels', err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  /* ------------------------------------------------------------ */
  /* Infinite scroll                                               */
  /* ------------------------------------------------------------ */

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMore(),
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  /* ------------------------------------------------------------ */
  /* Navigation                                                     */
  /* ------------------------------------------------------------ */

  const handleTileClick = (postId: string) => {
    router.push(`/reels/${postId}`);
  };

  /* ------------------------------------------------------------ */
  /* Render                                                        */
  /* ------------------------------------------------------------ */

  return (
    <>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6 pb-24">
        <div className="mb-6 px-2">
          <h2 className="gradient-text">Explore Reels</h2>
          <p className="text-sm text-[#6B6B7B] mt-1">
            Trending videos from around the world
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <ReelsGridTile
                post={post}
                onClick={() => handleTileClick(post.id)}
              />
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 mt-2">
            <ReelsGridSkeleton />
          </div>
        )}

        {hasMore && <div ref={observerRef} className="h-10" />}
      </main>

      <UploadFAB />
    </>
  );
}
