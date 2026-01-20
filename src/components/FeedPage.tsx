"use client";

import { useState, useEffect, useRef } from "react";
import { formatNumber } from "../data/mockData";
import { FeedCard } from "./FeedCard";
import { FeedSkeleton } from "./FeedSkeleton";
import { PullToRefresh } from "./PullToRefresh";
import { UploadFAB } from "./UploadFAB";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { FullscreenVideoModal } from "./FullscreenVideoModal";

interface FeedPageProps {
  initialPosts: any[];
}

export function FeedPage({ initialPosts }: FeedPageProps) {
  // ✅ SAFE INITIALIZATION
  const [posts, setPosts] = useState<any[]>(
    Array.isArray(initialPosts) ? initialPosts : []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [fullscreenPost, setFullscreenPost] = useState<any | null>(null);
  const [fullscreenTime, setFullscreenTime] = useState(0);

  // ✅ Restore scroll position
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPosition = sessionStorage.getItem("feed-scroll-position");
      if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition));
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "feed-scroll-position",
          window.scrollY.toString()
        );
      }
    };
  }, []);

  // ✅ Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore]);

  // ✅ FIXED: Load more posts (CRASH-PROOF)
  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/feed?page=${nextPage}`);
      const json = await res.json();

      const newPosts = Array.isArray(json?.data) ? json.data : [];

      if (newPosts.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [...safePrev, ...newPosts];
      });

      setPage(nextPage);
    } catch {
      toast.error("Failed to load more posts");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Pull-to-refresh (CRASH-PROOF)
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/feed?page=1");
      const json = await res.json();

      const freshPosts = Array.isArray(json?.data) ? json.data : [];

      setPosts(freshPosts);
      setPage(1);
      setHasMore(true);

      window.scrollTo({ top: 0, behavior: "smooth" });

      toast.success("Feed refreshed!", {
        description: "You're all caught up with the latest memes",
      });
    } catch {
      toast.error("Failed to refresh feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <PullToRefresh
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

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
            <RefreshCw
              className={`w-5 h-5 text-[#6C5CE7] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
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
              <FeedCard
                post={post}
                allPosts={posts}
                postIndex={index}
                onOpenFullscreen={(post, time) => {
                  setFullscreenPost(post);
                  setFullscreenTime(time);
                }}
              />
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

        {/* Observer target */}
        <div ref={observerRef} className="h-10" />
      </main>

      {fullscreenPost && (
        <FullscreenVideoModal
          isOpen={true}
          videoUrl={fullscreenPost.file_url}
          initialTime={fullscreenTime}
          autoPlay
          onClose={() => setFullscreenPost(null)}
        />
      )}

      <UploadFAB />
    </>
  );
}
