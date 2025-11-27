// src/components/FeedViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import type { Post } from '../data/mockData';
import { FeedPlayer } from './FeedPlayer';
import { usePosts } from '../contexts/PostsContext';

export function FeedViewer() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { posts: globalPosts } = usePosts();

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // If opened in single mode, the opener passes { single: true, post }
  useEffect(() => {
    const state = location.state as { posts?: Post[]; initialIndex?: number; single?: boolean; post?: Post } | undefined;
    if (state?.single && state.post) {
      setPosts([state.post]);
      setCurrentIndex(0);
      return;
    }
    const basePosts = state?.posts ?? globalPosts;
    setPosts(basePosts);
  }, [location.state, globalPosts]);

  useEffect(() => {
    if (!posts.length) return;
    const state = location.state as { posts?: Post[]; initialIndex?: number; single?: boolean } | undefined;
    if (state?.single) {
      setCurrentIndex(0);
      return;
    }
    if (typeof state?.initialIndex === 'number') {
      setCurrentIndex(state.initialIndex);
      return;
    }
    if (id) {
      const idx = posts.findIndex((p) => p.id === id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else setCurrentIndex(0);
  }, [posts, id, location.state]);

  // If not single mode, set up observer
  useEffect(() => {
    const state = location.state as { single?: boolean } | undefined;
    if (state?.single) return; // single mode -> no observer / scroll list

    if (!posts.length) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute('data-index') || '0';
            const index = parseInt(idxAttr, 10);
            setCurrentIndex(index);
            const post = posts[index];
            if (post) {
              // store minimal info only (ids + index) or nothing; keep replaced state small
              window.history.replaceState({ index }, '', `/feed/${post.id}`);
            }
          }
        });
      },
      { threshold: 0.6 }
    );
    const els = containerRef.current?.querySelectorAll('.feed-item');
    els?.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [posts, location.state]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-index="${currentIndex}"]`);
    el?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [currentIndex]);

  // Render single player (standalone) if single mode
  const state = location.state as { single?: boolean } | undefined;
  if (state?.single) {
    // posts[0] exists because we set it in effect above
    const singlePost = posts[0];
    if (!singlePost) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <FeedPlayer
          post={singlePost}
          isActive={true}
          hasNext={false}
          hasPrevious={false}
          onNext={() => {}}
          onPrevious={() => {}}
          standalone // new prop that hides caption/tags per requirements
        />
      </div>
    );
  }

  // Otherwise existing scrollable viewer
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div ref={containerRef} className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        <style>{`.feed-item{height:100vh}.feed-item::-webkit-scrollbar{display:none}`}</style>
        {posts.map((post, idx) => (
          <div key={post.id} data-index={idx} className="feed-item w-full snap-start snap-always flex-shrink-0">
            <FeedPlayer
              post={post}
              isActive={idx === currentIndex}
              hasNext={idx < posts.length - 1}
              hasPrevious={idx > 0}
              onNext={() => {
                const next = idx + 1;
                const el = containerRef.current?.querySelector(`[data-index="${next}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              onPrevious={() => {
                const prev = idx - 1;
                const el = containerRef.current?.querySelector(`[data-index="${prev}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
