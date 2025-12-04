import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  FC,
} from 'react';
import { Post, getDeviceId } from '../data/mockData';

interface ReelsContextValue {
  reels: Post[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

interface ApiReel {
  id: number;
  title: string;
  file_url: string;
  tags: string;
  user_name: string;
  created_at: string;
  type: 'image' | 'video';
  language: string;
}

interface ApiResponseLike {
  results?: ApiReel[];
  data?: ApiReel[];
  next?: string | null;
}

/**
 * ReelsContext — Phase 1 hardened:
 * - memoized deviceId
 * - AbortController + in-flight guard
 * - dedupe on append
 * - memoized provider value
 */
const ReelsContext = createContext<ReelsContextValue | undefined>(undefined);

interface ReelsProviderProps {
  children: ReactNode;
}

export const ReelsProvider: FC<ReelsProviderProps> = ({ children }) => {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // stable deviceId for this session
  const deviceId = useMemo(() => getDeviceId(), []);

  // in-flight request tracking & cancellation
  const inFlightRef = useRef<{ controller?: AbortController; id?: number }>({});
  const requestCounterRef = useRef<number>(0);

  // extract array from different API shapes
  const normalizeResponseToArray = useCallback((json: any): ApiReel[] => {
    if (!json) return [];
    if (Array.isArray(json)) return json as ApiReel[];
    if (Array.isArray((json as ApiResponseLike).results)) return (json as ApiResponseLike).results!;
    if (Array.isArray((json as ApiResponseLike).data)) return (json as ApiResponseLike).data!;
    return [];
  }, []);

  const computeHasMore = useCallback((json: any, currentPageDataLength: number): boolean => {
    if (typeof json === 'object' && json !== null && 'next' in json) {
      return Boolean((json as ApiResponseLike).next);
    }
    // fallback: if we received fewer than page size, API might have no more; here assume any items means possible more
    return currentPageDataLength > 0;
  }, []);

  const normalizeToPost = useCallback(
    (apiReel: ApiReel): Post => ({
      id: String(apiReel.id),
      type: apiReel.type,
      url: apiReel.file_url,
      images: undefined,
      aspectRatio: undefined,
      thumbnail: undefined,
      caption: apiReel.title,
      tags: apiReel.tags
        ? Array.from(new Set(apiReel.tags.split(',').map((t) => t.trim()).filter(Boolean)))
        : [],
      deviceId, // keep as string to match Post type
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    }),
    [deviceId]
  );

  const safeSetReels = useCallback((updater: (prev: Post[]) => Post[]) => {
    setReels((prev) => updater(prev));
  }, []);

  const fetchReels = useCallback(
    async (pageToLoad: number, append: boolean) => {
      const requestId = ++requestCounterRef.current;
      const controller = new AbortController();
      inFlightRef.current = { controller, id: requestId };

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/reels/?page=${pageToLoad}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to fetch reels: ${res.status} ${res.statusText} ${text}`);
        }

        const json = await res.json();
        const data = normalizeResponseToArray(json);
        const normalized = data.map(normalizeToPost);

        safeSetReels((prev) => {
          if (!append) return normalized;
          const existingIds = new Set(prev.map((p) => p.id));
          const filtered = normalized.filter((p) => !existingIds.has(p.id));
          if (filtered.length === 0) return prev;
          return [...prev, ...filtered];
        });

        setHasMore(computeHasMore(json, normalized.length));
        setPage(pageToLoad);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // aborted, ignore
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error while fetching reels';
        setError(message);
        // eslint-disable-next-line no-console
        console.error('ReelsProvider.fetchReels error:', message);
      } finally {
        if (inFlightRef.current.id === requestId) {
          inFlightRef.current = {};
          setLoading(false);
        }
      }
    },
    [deviceId, normalizeResponseToArray, normalizeToPost, safeSetReels, computeHasMore]
  );

  useEffect(() => {
    // initial load
    fetchReels(1, false);

    return () => {
      try {
        inFlightRef.current.controller?.abort();
      } catch (_) {
        /* ignore */
      }
    };
  }, [fetchReels]);

  const refresh = useCallback(async () => {
    try {
      inFlightRef.current.controller?.abort();
    } catch (_) {
      /* ignore */
    }
    await fetchReels(1, false);
  }, [fetchReels]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchReels(nextPage, true);
  }, [fetchReels, page, loading, hasMore]);

  const contextValue = useMemo(
    () => ({ reels, loading, error, refresh, loadMore, hasMore }),
    [reels, loading, error, refresh, loadMore, hasMore]
  );

  return <ReelsContext.Provider value={contextValue}>{children}</ReelsContext.Provider>;
};

export const useReels = (): ReelsContextValue => {
  const ctx = useContext(ReelsContext);
  if (!ctx) {
    throw new Error('useReels must be used within a ReelsProvider');
  }
  return ctx;
};
