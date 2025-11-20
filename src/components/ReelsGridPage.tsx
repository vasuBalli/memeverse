import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReelsGridTile } from './ReelsGridTile';
import { ReelsGridSkeleton } from './ReelsGridSkeleton';
import { UploadFAB } from './UploadFAB';
import { motion } from 'motion/react';
import { usePosts } from '../contexts/PostsContext';
import type { Post } from '../data/mockData';

export function ReelsGridPage() {
  const { posts, loading, error } = usePosts();
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Take only videos from global posts
  useEffect(() => {
    const videos = posts.filter((post) => post.type === 'video');
    setVideoPosts(videos);
    setPage(1); // reset pagination when fresh data arrives
  }, [posts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, isLoadingMore, videoPosts]);

  const loadMore = async () => {
    // For now we "fake" pagination by duplicating existing videos
    if (!videoPosts.length) return;

    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const baseVideos = posts.filter((post) => post.type === 'video');
    const newPosts = baseVideos.map((post) => ({
      ...post,
      id: `${post.id}-page-${page + 1}`, // make IDs unique per page
    }));

    setVideoPosts((prev) => [...prev, ...newPosts]);
    setPage((prev) => prev + 1);
    setIsLoadingMore(false);
  };

  const handleTileClick = (postId: string) => {
    const index = videoPosts.findIndex((p) => p.id === postId);
    navigate(`/reels/${postId}`, { state: { posts: videoPosts, initialIndex: index } });
  };

  if (error) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6 pb-24">
          <p className="text-red-500">{error}</p>
        </main>
        <UploadFAB />
      </>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6 pb-24">
        {/* Grid Header */}
        <div className="mb-6 px-2">
          <h2 className="gradient-text">Explore Reels</h2>
          <p className="text-sm text-[#6B6B7B] mt-1">
            Trending videos from around the world
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
          {videoPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <ReelsGridTile post={post} onClick={() => handleTileClick(post.id)} />
            </motion.div>
          ))}

          {/* Loading skeletons */}
          {(loading || isLoadingMore) && (
            <>
              <ReelsGridSkeleton />
              <ReelsGridSkeleton />
              <ReelsGridSkeleton />
            </>
          )}
        </div>

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-10" />
      </main>

      <UploadFAB />
    </>
  );
}
