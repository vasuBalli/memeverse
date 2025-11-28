// src/components/FeedPage.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '../data/mockData';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { UploadFAB } from './UploadFAB';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePosts } from '../contexts/PostsContext';
import { Virtuoso } from 'react-virtuoso';



export function FeedPage() {
  const { posts, loading, error, refresh, loadMore, hasMore } = usePosts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const virtuosoRef = useRef<any>(null);

  // restoring flag toggles small CSS overlay to hide feed during scroll restore
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Feed refreshed!', { description: "You’re all caught up with the latest memes!" });
    } catch (err) {
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
      console.error('loadMore error', err);
    }
  }, [hasMore, loadMore]);

  if (error) return <div className="text-red-500">{error}</div>;

  // disable browser scroll restoration to control it manually
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch {}
    }
    return () => { try { window.history.scrollRestoration = 'auto'; } catch {} };
  }, []);

  // Restore scroll by item index (Virtuoso) when returning from player
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (!initialLoadRef.current) return;
    if (loading) return; // wait until loading finishes
    initialLoadRef.current = false;

    setIsRestoring(true); // hide feed visually while restoring

    let rafHandle: number | null = null;
    let attempts = 0;
    const maxAttempts = 60; // ~1 second retry

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
        // swallow and allow retry
        return false;
      }
    };

    const loop = () => {
      // if virtuoso's API is ready, attempt immediate restore
      if (virtuosoRef.current && typeof virtuosoRef.current.scrollToIndex === 'function') {
        const ok = tryRestore();
        if (!ok) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            // give up and fallback to pixel/top
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
        // fallback after waiting
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
  }, [loading, posts.length]);



    // Synchronous pixel-scroll restore BEFORE first paint to avoid visual jump.
  // This only applies if we have a saved pixel fallback (memeverse_open_scroll).
  useLayoutEffect(() => {
    try {
      const yStr = sessionStorage.getItem('memeverse_open_scroll');
      if (yStr != null) {
        const y = Number(yStr);
        if (!Number.isNaN(y) && y > 0) {
          // set scroll synchronously before paint to avoid initial top flash
          window.scrollTo({ top: y, left: 0, behavior: 'auto' });
          // we DON'T remove the keys here — leave them for the index-based restore loop which will clean them up
        }
      }
    } catch (err) {
      // ignore
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* add data-restoring attr so CSS can hide the feed while restoring */}
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

        <div className="flex items-center justify-between mb-6">
          <div>
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
            <RefreshCw className={`w-5 h-5 text-[#6C5CE7] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <Virtuoso
          ref={virtuosoRef}
          useWindowScroll
          totalCount={posts.length}
          endReached={loadMoreHandler}
          overscan={100}
          itemContent={(index) => {
            const post = posts[index];
            return (
              <div key={post.id} className="mb-6">
                <div className="mx-auto w-full max-w-[420px]">
                  <FeedCard post={post} index={index} />
                </div>
              </div>
            );
          }}
          components={{
            Footer: () => loading ? (
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
