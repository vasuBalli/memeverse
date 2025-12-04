// src/contexts/VideoSoundContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  FC,
} from 'react';

interface VideoSoundContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (value: boolean) => void;

  registerPlayer: (id: string, el: HTMLVideoElement | null) => void;
  unregisterPlayer: (id: string) => void;
  announcePlay: (id: string, el?: HTMLVideoElement | null) => Promise<void>;
  announcePause: (id: string) => void;

  getActiveId: () => string | null;
}

const STORAGE_KEY = 'memeverse:video:isMuted';
const VideoSoundContext = createContext<VideoSoundContextValue | undefined>(undefined);

interface VideoSoundProviderProps {
  children: ReactNode;
  defaultMuted?: boolean;
  /**
   * visibilityPauseThreshold: intersectionRatio below which provider auto-pauses the active video.
   * 0.5 = 50% visible. Tune to 0.4-0.6 as you prefer.
   */
  visibilityPauseThreshold?: number;
}

export const VideoSoundProvider: FC<VideoSoundProviderProps> = ({
  children,
  defaultMuted = false,
  visibilityPauseThreshold = 0.45,
}) => {
  // persisted mute
  const readPersisted = useCallback((): boolean | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      return raw === 'true';
    } catch {
      return null;
    }
  }, []);

  const persisted = readPersisted();
  const [isMuted, setIsMuted] = useState<boolean>(persisted != null ? persisted : defaultMuted);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(STORAGE_KEY, isMuted ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, [isMuted]);

  // registry + active id
  const playersRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const activeIdRef = useRef<string | null>(null);

  // IntersectionObserver used to watch visibility of the currently-active element.
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const observedElementRef = useRef<HTMLVideoElement | null>(null);

  const registerPlayer = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (!id) return;
    if (el) playersRef.current.set(id, el);
    else {
      playersRef.current.delete(id);
      if (activeIdRef.current === id) activeIdRef.current = null;
    }
  }, []);

  const unregisterPlayer = useCallback((id: string) => {
    playersRef.current.delete(id);
    if (activeIdRef.current === id) activeIdRef.current = null;
  }, []);

  const safePause = useCallback((el?: HTMLVideoElement | null) => {
    try {
      el?.pause();
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * stopObserving: disconnect any existing visibility observer and clear references
   */
  const stopObserving = useCallback(() => {
    try {
      if (visibilityObserverRef.current) {
        visibilityObserverRef.current.disconnect();
        visibilityObserverRef.current = null;
      }
    } catch {}
    observedElementRef.current = null;
  }, []);

  /**
   * announcePlay: pause other players immediately, mark this id active,
   * and start observing the provided element's visibility. When visibility
   * drops below threshold, auto-pause this element.
   *
   * Important: pass the element (videoRef.current) when calling announcePlay.
   */
  const announcePlay = useCallback(
    async (id: string, el?: HTMLVideoElement | null) => {
      if (!id) return;

      // pause all registered players except the one that will play
      playersRef.current.forEach((pEl, pId) => {
        if (pId !== id && pEl !== el) safePause(pEl);
      });

      // also attempt to pause any other document <video> elements to be robust
      try {
        const allVideos = Array.from(document.querySelectorAll('video'));
        allVideos.forEach((v) => {
          if (el && v === el) return;
          safePause(v as HTMLVideoElement);
        });
      } catch {
        /* ignore */
      }

      // mark active
      activeIdRef.current = id;

      // apply mute state onto the element (if provided)
      if (el) {
        try {
          el.muted = isMuted;
        } catch {
          /* ignore */
        }
      } else {
        // if element not provided, try registered
        const reg = playersRef.current.get(id);
        if (reg) {
          try {
            reg.muted = isMuted;
          } catch {}
        }
      }

      // Stop previous observer if any
      stopObserving();

      // Setup new visibility observer for this element (if supplied)
      if (el && typeof IntersectionObserver !== 'undefined') {
        observedElementRef.current = el;

        const obs = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            const ratio = entry?.intersectionRatio ?? 0;
            // If it falls below threshold, pause and clear active
            if (ratio < visibilityPauseThreshold) {
              try {
                (el as HTMLVideoElement).pause();
              } catch {}
              if (activeIdRef.current === id) activeIdRef.current = null;
              // disconnect observer since we've paused
              try {
                obs.disconnect();
              } catch {}
              visibilityObserverRef.current = null;
              observedElementRef.current = null;
            }
            // else: keep playing
          },
          {
            threshold: [0, 0.25, 0.4, 0.5, 0.75, 1],
            // root default is viewport (good)
          }
        );

        visibilityObserverRef.current = obs;
        try {
          obs.observe(el);
        } catch {
          // observing may fail in some environments; ignore
          visibilityObserverRef.current = null;
          observedElementRef.current = null;
        }
      }

      return Promise.resolve();
    },
    [isMuted, safePause, stopObserving, visibilityPauseThreshold]
  );

  const announcePause = useCallback((id: string) => {
    if (!id) return;
    if (activeIdRef.current === id) activeIdRef.current = null;
    // if the paused id was the observed element, stop observing
    const regEl = playersRef.current.get(id);
    if (regEl && observedElementRef.current === regEl) {
      try {
        visibilityObserverRef.current?.disconnect();
      } catch {}
      visibilityObserverRef.current = null;
      observedElementRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        playersRef.current.forEach((el) => {
          try {
            el.muted = next;
          } catch {}
        });
      } catch {}
      return next;
    });
  }, []);

  const setMuted = useCallback((value: boolean) => {
    setIsMuted(() => {
      try {
        playersRef.current.forEach((el) => {
          try {
            el.muted = value;
          } catch {}
        });
      } catch {}
      return value;
    });
  }, []);

  const getActiveId = useCallback(() => activeIdRef.current, []);

  // defensive: ensure registered players reflect mute state when it changes
  useEffect(() => {
    try {
      playersRef.current.forEach((el) => {
        try {
          el.muted = isMuted;
        } catch {}
      });
    } catch {}
  }, [isMuted]);

  // cleanup observer on unmount
  useEffect(() => {
    return () => {
      try {
        visibilityObserverRef.current?.disconnect();
      } catch {}
      visibilityObserverRef.current = null;
      observedElementRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      isMuted,
      toggleMute,
      setMuted,
      registerPlayer,
      unregisterPlayer,
      announcePlay,
      announcePause,
      getActiveId,
    }),
    [isMuted, toggleMute, setMuted, registerPlayer, unregisterPlayer, announcePlay, announcePause, getActiveId]
  );

  return <VideoSoundContext.Provider value={value}>{children}</VideoSoundContext.Provider>;
};

export const useVideoSound = (): VideoSoundContextValue => {
  const ctx = useContext(VideoSoundContext);
  if (!ctx) {
    throw new Error('useVideoSound must be used within a VideoSoundProvider');
  }
  return ctx;
};
