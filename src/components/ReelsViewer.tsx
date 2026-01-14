'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Post } from '@/data/mockData';
import { ReelPlayer } from './ReelPlayer';

interface ReelsViewerProps {
  initialPosts: Post[];
  initialIndex: number;
}

export function ReelsViewer({
  initialPosts,
  initialIndex,
}: ReelsViewerProps) {
  const router = useRouter();

  const [posts] = useState<Post[]>(initialPosts);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* Lock background scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /* Observe active reel */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const index = Number(
            entry.target.getAttribute('data-index')
          );

          if (Number.isNaN(index)) return;

          setCurrentIndex(index);

          const post = posts[index];
          if (post) {
            router.replace(`/reels/${post.id}`);
          }
        });
      },
      { threshold: 0.5 }
    );

    const items =
      containerRef.current?.querySelectorAll('.reel-item');

    items?.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [posts, router]);

  /* Scroll to initial reel */
  useEffect(() => {
    const el = containerRef.current?.querySelector(
      `[data-index="${initialIndex}"]`
    );
    el?.scrollIntoView({ behavior: 'auto' });
  }, [initialIndex]);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowDown') scrollTo(currentIndex + 1);
      if (e.key === 'ArrowUp') scrollTo(currentIndex - 1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex]);

  const scrollTo = (index: number) => {
    const el = containerRef.current?.querySelector(
      `[data-index="${index}"]`
    );
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full glass flex items-center justify-center"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Reels container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory reel-container"
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            data-index={index}
            className="reel-item w-full h-full snap-start"
          >
            <ReelPlayer
              post={post}
              isActive={index === currentIndex}
              hasNext={index < posts.length - 1}
              hasPrevious={index > 0}
              onNext={() => scrollTo(index + 1)}
              onPrevious={() => scrollTo(index - 1)}
            />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 flex gap-1 z-50">
        {posts.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all ${
              i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
