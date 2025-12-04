// src/hooks/useLazyVideo.ts
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useLazyVideo
 *
 * - Works correctly with virtualization
 * - Loads the video *only when needed*
 * - Reports when the element is in view
 * - Re-attaches observer if ref changes
 * - Uses rootMargin to start loading before fully entering screen
 */

export function useLazyVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [inView, setInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  // Attach IntersectionObserver safely
  const attachObserver = useCallback((element: HTMLVideoElement | null) => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;

        setInView(isVisible);

        if (isVisible) {
          // Allow loading when video gets close to viewport
          setShouldLoad(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px 0px", // start loading slightly before entering view
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Handle ref changes (important for virtualization)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const cleanup = attachObserver(el);
    return cleanup;
  }, [attachObserver, videoRef.current]);

  // Listen for “canplay” (metadata loaded)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldLoad) return;

    const onCanPlay = () => setCanPlay(true);
    el.addEventListener("canplay", onCanPlay);

    return () => el.removeEventListener("canplay", onCanPlay);
  }, [shouldLoad]);

  return {
    videoRef,
    shouldLoad,
    inView,
    canPlay,
  };
}
