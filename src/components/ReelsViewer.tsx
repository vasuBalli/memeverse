import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { Post } from '../data/mockData';
import { ReelPlayer } from './ReelPlayer';
import { X } from 'lucide-react';
import { usePosts } from '../contexts/PostsContext';

export function ReelsViewer() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { posts: globalPosts } = usePosts();

  // Get posts from location.state (if navigated from grid/feed), else from globalPostss
  const [posts, setPosts] = useState<Post[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize posts (videos only) from state or globalPosts
  useEffect(() => {
    const state = location.state as { posts?: Post[]; initialIndex?: number } | undefined;
    const basePosts = state?.posts ?? globalPosts;

    const videoPosts = basePosts.filter((p) => p.type === 'video');
    setPosts(videoPosts);
  }, [location.state, globalPosts]);

  // Set initial currentIndex once posts are ready
  useEffect(() => {
    if (!posts.length) return;

    const state = location.state as { posts?: Post[]; initialIndex?: number } | undefined;

    if (typeof state?.initialIndex === 'number') {
      setCurrentIndex(state.initialIndex);
      return;
    }

    if (id) {
      const idx = posts.findIndex((p) => p.id === id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [posts, id, location.state]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Intersection Observer to track which video is in view
  useEffect(() => {
    if (!posts.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexAttr = entry.target.getAttribute('data-index') || '0';
            const index = parseInt(indexAttr, 10);
            setCurrentIndex(index);

            // Update URL
            const post = posts[index];
            if (post) {
              window.history.replaceState(
                { posts, initialIndex: index },
                '',
                `/reels/${post.id}`
              );
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.5,
      }
    );

    const videoElements = containerRef.current?.querySelectorAll('.reel-item');
    videoElements?.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [posts]);

  // Scroll to initial video on mount/update when currentIndex changes first time
  useEffect(() => {
    const element = containerRef.current?.querySelector(
      `[data-index="${currentIndex}"]`
    );
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < posts.length - 1) {
        const element = containerRef.current?.querySelector(
          `[data-index="${currentIndex + 1}"]`
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        const element = containerRef.current?.querySelector(
          `[data-index="${currentIndex - 1}"]`
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      const element = containerRef.current?.querySelector(
        `[data-index="${currentIndex + 1}"]`
      );
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const element = containerRef.current?.querySelector(
        `[data-index="${currentIndex - 1}"]`
      );
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Scrollable container with snap */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth reel-container"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .reel-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {posts.map((post, index) => (
          <div
            key={post.id}
            data-index={index}
            className="reel-item w-full h-full snap-start snap-always flex-shrink-0"
          >
            <ReelPlayer
              post={post}
              isActive={index === currentIndex}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext={index < posts.length - 1}
              hasPrevious={index > 0}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {posts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex gap-1">
          {posts
            .slice(
              Math.max(0, currentIndex - 2),
              Math.min(posts.length, currentIndex + 3)
            )
            .map((post, idx) => {
              const actualIndex = Math.max(0, currentIndex - 2) + idx;
              return (
                <div
                  key={post.id}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    actualIndex === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/30'
                  }`}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
