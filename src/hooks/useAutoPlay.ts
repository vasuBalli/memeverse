import { useEffect } from 'react';

export function useAutoPlay(ref: React.RefObject<HTMLVideoElement>, options: { threshold?: number } = {}) {
  const threshold = options.threshold ?? 0.5;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // try to play, ignore errors (autoplay policies)
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
}
