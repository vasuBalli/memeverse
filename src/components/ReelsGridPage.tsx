import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPosts } from '../data/mockData';
import { ReelsGridTile } from './ReelsGridTile';
import { ReelsGridSkeleton } from './ReelsGridSkeleton';
import { UploadFAB } from './UploadFAB';
import { motion } from 'motion/react';

export function ReelsGridPage() {
  const [posts, setPosts] = useState(mockPosts.filter(post => post.type === 'video'));
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  const loadMore = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPosts = mockPosts
      .filter(post => post.type === 'video')
      .map(post => ({
        ...post,
        id: `${post.id}-page${page + 1}`
      }));
    
    setPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);
    setIsLoading(false);
  };

  const handleTileClick = (postId: string) => {
    const index = posts.findIndex(p => p.id === postId);
    navigate(`/reels/${postId}`, { state: { posts, initialIndex: index } });
  };

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

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 mt-1 sm:mt-2">
            <ReelsGridSkeleton />
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-10" />
      </main>

      <UploadFAB />
    </>
  );
}