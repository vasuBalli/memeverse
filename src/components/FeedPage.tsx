// src/components/FeedPage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatNumber } from '../data/mockData';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { UploadFAB } from './UploadFAB';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { usePosts } from '../contexts/PostsContext';
import { Virtuoso } from 'react-virtuoso';


export function FeedPage() {
  const { posts, loading, error, refresh, loadMore, hasMore } = usePosts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const virtuosoRef = useRef<any>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      // keep original behavior: scroll window to top after refresh
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Feed refreshed!', {
        description: "You’re all caught up with the latest memes!",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('refresh error', err);
      toast.error('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const loadMoreHandler = useCallback(async () => {
    if (!hasMore) return;
    try {
      await loadMore();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('loadMore error', err);
    }
  }, [hasMore, loadMore]);

  if (error) return <div className="text-red-500">{error}</div>;
  // ensure browser does not auto-restore scroll
useEffect(() => {
  if ('scrollRestoration' in window.history) {
    try {
      // set manual to stop browser auto-restoring
      window.history.scrollRestoration = 'manual';
    } catch {
      /* ignore (some browsers in some modes can throw) */
    }
  }
  return () => {
    // restore default behavior when leaving page
    try {
      window.history.scrollRestoration = 'auto';
    } catch {}
  };
}, []);

// force top-of-page once posts are loaded (avoid racing with browser restore)
const initialLoadRef = useRef(true);
useEffect(() => {
  // when posts finished loading for the first time, scroll to top.
  if (initialLoadRef.current && !loading) {
    initialLoadRef.current = false;
    // try virtuoso scroll if available
    try {
      // if you use Virtuoso ref:
      // (virtuosoRef as any)?.current?.scrollToIndex?.(0);
      // also fallback to window
    } catch {}
    // always ensure window scroll reset too
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}, [loading, posts]);

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* restored to your original header styling */}
            <h2 className="gradient-text">Your Feed</h2>
            <p className="text-sm text-[#6B6B7B] mt-1">
              {formatNumber(posts.length)} total posts
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#15151F] border border-white/10 hover:bg-[#1E1E2E] transition-colors disabled:opacity-50"
            aria-label="Refresh feed"
          >
            <RefreshCw
              className={`w-5 h-5 text-[#6C5CE7] ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Virtualized list using window scroll so whole page scroll works */}
        <Virtuoso
          ref={virtuosoRef}
          useWindowScroll // <--- important: use the window scroll so left/right areas scroll the page
          totalCount={posts.length}
          endReached={loadMoreHandler}
          overscan={300}
            itemContent={(index) => {
            const post = posts[index];
            return (
              <div key={post.id} className="mb-6">
                {/* Center and constrain width to Instagram-like width */}
                <div className="mx-auto w-full max-w-[420px]">
                  <FeedCard post={post} />
                </div>
              </div>
            );
          }}


          components={{
            Footer: () =>
              loading ? (
                <div className="mt-6 space-y-6">
                  <FeedSkeleton />
                  <FeedSkeleton />
                </div>
              ) : null,
          }}
        />
      </main>

      <UploadFAB />
    </>
  );
}
