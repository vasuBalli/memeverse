// src/components/FeedPage.tsx
import React, { useEffect, useRef, useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { formatNumber } from '../data/mockData';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { UploadFAB } from './UploadFAB';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePostsData, usePostsActions } from '../contexts/PostsContext';
import { Virtuoso } from 'react-virtuoso';

// Small RUM / debug event sender (adapt to your analytics)
function sendRumEvent(eventName: string, payload: Record<string, any>) {
  // replace with your analytics call or window.navigator.sendBeacon(...)
  // eslint-disable-next-line no-console
  console.log('[RUM]', eventName, payload);
}

export function FeedPage() {
  const { posts, loading, error, hasMore } = usePostsData();
  const { refresh, loadMore } = usePostsActions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // restoring flag toggles small CSS overlay to hide feed during scroll restore
  const [isRestoring, setIsRestoring] = useState(false);

  const virtuosoRef = useRef<any>(null);
  const initialLoadRef = useRef(true);

  // Defensive dedupe
  const uniquePosts = useMemo(() => {
    const map = new Map<string, typeof posts[number]>();
    for (const p of posts) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [posts]);

  // Guard to prevent duplicate loadMore triggers
  const loadMoreInFlightRef = useRef(false);

  // Wrap loadMore for logging and guarding (local wrapper)
  const wrappedLoadMore = useCallback(async () => {
    if (loadMoreInFlightRef.current) return;
    if (!hasMore) return;
    loadMoreInFlightRef.current = true;
    const start = performance.now();
    sendRumEvent('loadMore.request', { timestamp: Date.now(), currentCount: uniquePosts.length });

    try {
      await loadMore();
      const latency = Math.round(performance.now() - start);
      sendRumEvent('loadMore.success', { latency, newCount: uniquePosts.length });
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      sendRumEvent('loadMore.error', { latency, error: String(err) });
      // eslint-disable-next-line no-console
      console.error('loadMore error', err);
    } finally {
      // small delay before allowing next call — gives provider time to flip `loading`
      setTimeout(() => {
        loadMoreInFlightRef.current = false;
      }, 100);
    }
  }, [loadMore, uniquePosts.length, hasMore]);

  // Save/restore scroll position (unchanged logic with rAF)
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('feed-scroll-position');
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      if (!Number.isNaN(pos)) window.scrollTo(0, pos);
    }
    const handleBeforeUnload = () => {
      sessionStorage.setItem('feed-scroll-position', String(window.scrollY || 0));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem('feed-scroll-position', String(window.scrollY || 0));
        rafId = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      sessionStorage.setItem('feed-scroll-position', String(window.scrollY || 0));
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Feed refreshed!', { description: "You’re all caught up with the latest memes!" });
      sendRumEvent('feed.refresh', { timestamp: Date.now() });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('refresh error', err);
      toast.error('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Disable browser scroll restoration so we control restoring manually
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch {}
    }
    return () => { try { window.history.scrollRestoration = 'auto'; } catch {} };
  }, []);

  // Synchronous pixel-scroll restore BEFORE first paint to avoid visual jump.
  useLayoutEffect(() => {
    try {
      const yStr = sessionStorage.getItem('memeverse_open_scroll');
      if (yStr != null) {
        const y = Number(yStr);
        if (!Number.isNaN(y) && y > 0) {
          // set scroll synchronously before paint to avoid initial top flash
          window.scrollTo({ top: y, left: 0, behavior: 'auto' });
          // leave keys for index-based restore to clean up
        }
      }
    } catch (err) {
      // ignore
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Index-based restore after Virtuoso is ready (retry loop)
  useEffect(() => {
    if (!initialLoadRef.current) return;
    if (loading) return; // wait until initial load finishes
    initialLoadRef.current = false;

    setIsRestoring(true);

    let rafHandle: number | null = null;
    let attempts = 0;
    const maxAttempts = 60;

    const tryRestore = () => {
      try {
        const idxStr = sessionStorage.getItem('memeverse_open_index');
        if (idxStr != null) {
          const idx = Number(idxStr);
          if (!Number.isNaN(idx) && virtuosoRef.current?.scrollToIndex) {
            virtuosoRef.current.scrollToIndex({ index: idx, align: 'start' });
            sessionStorage.removeItem('memeverse_open_index');
            sessionStorage.removeItem('memeverse_open_scroll');
            setIsRestoring(false);
            return true;
          }
        }

        const yStr = sessionStorage.getItem('memeverse_open_scroll');
        if (yStr != null) {
          const y = Number(yStr);
          if (!Number.isNaN(y)) {
            window.scrollTo({ top: y, left: 0, behavior: 'auto' });
            sessionStorage.removeItem('memeverse_open_index');
            sessionStorage.removeItem('memeverse_open_scroll');
            setIsRestoring(false);
            return true;
          }
        }

        // nothing to restore -> scroll to top
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        setIsRestoring(false);
        return true;
      } catch (err) {
        return false;
      }
    };

    const loop = () => {
      if (virtuosoRef.current && typeof virtuosoRef.current.scrollToIndex === 'function') {
        const ok = tryRestore();
        if (!ok) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            tryRestore();
            setIsRestoring(false);
            return;
          } else {
            rafHandle = requestAnimationFrame(loop);
          }
        }
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        tryRestore();
        setIsRestoring(false);
        return;
      }
      rafHandle = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (rafHandle != null) cancelAnimationFrame(rafHandle);
      setIsRestoring(false);
    };
  }, [loading, uniquePosts.length]);

  // virtualization item renderer; memoized
  const itemContent = useCallback((index: number) => {
    const post = uniquePosts[index];
    if (!post) return null;

    // Keep the exact wrapper used in production to preserve width & gap
    const inner = index < 6 ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.28 }}
      >
        <FeedCard post={post} allPosts={uniquePosts} postIndex={index} />
      </motion.div>
    ) : (
      <FeedCard post={post} allPosts={uniquePosts} postIndex={index} />
    );

    return (
      <div key={post.id} className="mb-6">
        <div className="mx-auto w-full max-w-[420px]">
          {inner}
        </div>
      </div>
    );
  }, [uniquePosts]);

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main
        className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24"
        data-restoring={isRestoring ? 'true' : 'false'}
      >
        <style>{`
          /* tiny restoring CSS: visibility + pointer-events hidden, but keep layout so no reflow */
          main[data-restoring="true"] {
            opacity: 0;
            pointer-events: none;
            user-select: none;
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="gradient-text">Your Feed</h2>
            <p className="text-sm text-[#6B6B7B] mt-1">
              {formatNumber(uniquePosts.length * 1234)} total posts
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading === true}
            className="p-2 rounded-xl bg-[#15151F] border border-white/10 hover:bg-[#1E1E2E] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[#6C5CE7] ${loading === true ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Virtuoso tied to window scroll so header scrolls with the page */}
        <Virtuoso
          ref={virtuosoRef}
          useWindowScroll
          totalCount={uniquePosts.length}
          data={uniquePosts}
          itemContent={(index) => itemContent(index)}
          endReached={() => {
            if (!loading && hasMore) wrappedLoadMore();
          }}
          overscan={300}
          components={{
            Footer: () => (loading ? (
              <div className="mt-6 space-y-6">
                <FeedSkeleton />
                <FeedSkeleton />
              </div>
            ) : <div style={{ height: 60 }} />),
          }}
          atBottomStateChange={(atBottom) => {
            if (atBottom && hasMore && !loading) {
              wrappedLoadMore();
            }
          }}
        />
      </main>

      <UploadFAB />
    </>
  );
}

export default FeedPage;
