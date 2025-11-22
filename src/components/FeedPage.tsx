import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../data/mockData';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { UploadFAB } from './UploadFAB';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { usePosts } from '../contexts/PostsContext';

export function FeedPage() {
  const { posts, loading, error, refresh, loadMore, hasMore } = usePosts();
  const [localPosts, setLocalPosts] = useState(posts);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  

  // Sync context posts → localPosts (only when API loads)
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Restore scroll

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        loadMore();  // <-- NOW using context loadMore
      }
    },
    { threshold: 0.5 }
  );

  if (observerRef.current) observer.observe(observerRef.current);
  return () => observer.disconnect();
}, [loading, hasMore, loadMore]);



  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, isLoadingMore]);

  
  const handleRefresh = async () => {
    setIsRefreshing(true);

    await refresh(); // calls API again from context

    setLocalPosts(posts); // reset feed after refresh
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsRefreshing(false);

    toast.success('Feed refreshed!', {
      description: "You’re all caught up with the latest memes!",
    });
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="gradient-text">Your Feed</h2>
            <p className="text-sm text-[#6B6B7B] mt-1">
              {formatNumber(localPosts.length)} total posts
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

        {/* Posts */}
        <div className="space-y-6">
          {localPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <FeedCard post={post} allPosts={localPosts} postIndex={index} />
            </motion.div>
          ))}
        </div>

        {/* Skeleton */}
        {(loading || isLoadingMore) && (
          <div className="mt-6 space-y-6">
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        )}

        <div ref={observerRef} className="h-10" />
      </main>

      <UploadFAB />
    </>
  );
}
