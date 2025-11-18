import { useState, useEffect, useRef } from 'react';
import { mockPosts, formatNumber } from '../data/mockData';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { UploadFAB } from './UploadFAB';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function FeedPage() {
  const [posts, setPosts] = useState(mockPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Restore scroll position
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('feed-scroll-position');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    return () => {
      sessionStorage.setItem('feed-scroll-position', window.scrollY.toString());
    };
  }, []);

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPosts = mockPosts.map(post => ({
      ...post,
      id: `${post.id}-page${page + 1}`
    }));
    
    setPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset to initial posts
    setPosts(mockPosts);
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsRefreshing(false);
    toast.success('Feed refreshed!', {
      description: 'You\'re all caught up with the latest memes',
    });
  };

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Feed Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="gradient-text">Your Feed</h2>
            <p className="text-sm text-[#6B6B7B] mt-1">
              {formatNumber(posts.length * 1234)} total posts
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#15151F] border border-white/10 hover:bg-[#1E1E2E] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[#6C5CE7] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <FeedCard post={post} allPosts={posts} postIndex={index} />
            </motion.div>
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="mt-6 space-y-6">
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-10" />
      </main>

      <UploadFAB />
    </>
  );
}