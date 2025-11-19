import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ReelTile } from '../components/ReelTile';
import { ReelTileSkeleton } from '../components/SkeletonLoader';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { mockMemes, generateMoreMemes } from '../data/mockData';
import { Meme } from '../types';

export function ReelsGrid() {
  const [reels, setReels] = useState<Meme[]>(mockMemes);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadMore = () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setTimeout(() => {
      const newReels = generateMoreMemes(reels.length, 12);
      setReels([...reels, ...newReels]);
      setLoading(false);

      // For demo, stop after 60 items
      if (reels.length + newReels.length >= 60) {
        setHasMore(false);
      }
    }, 1000);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, reels.length]);

  const handleReelClick = (index: number) => {
    navigate(`/reels/${reels[index].id}`, { state: { reels, index } });
  };

  // Assign random sizes for variety (Instagram-like)
  const getTileSize = (index: number): 'small' | 'medium' | 'large' => {
    const patterns = ['small', 'small', 'medium', 'small', 'large', 'small'];
    return patterns[index % patterns.length] as 'small' | 'medium' | 'large';
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Explore Reels
          </h2>
          <p className="text-white/60">
            Trending videos from across the internet
          </p>
        </motion.div>

        {/* Reels Grid - Instagram Explore Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] gap-1">
          {reels.map((reel, index) => (
            <ReelTile
              key={reel.id}
              meme={reel}
              onClick={() => handleReelClick(index)}
              size={getTileSize(index)}
            />
          ))}

          {/* Loading Skeletons */}
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
              <ReelTileSkeleton key={`skeleton-${i}`} />
            ))}
        </div>

        {/* Intersection Observer Target */}
        <div ref={observerRef} className="h-10 mt-4" />

        {/* End Message */}
        {!hasMore && (
          <motion.div
            className="text-center py-8 text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            You've seen it all! 🎉
          </motion.div>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
}
