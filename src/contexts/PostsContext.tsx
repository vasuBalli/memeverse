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

interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

interface ApiPost {
  id: number;
  title: string;
  file_url: string;
  tags: string;
  user_name: string;
  created_at: string;
  type: 'image' | 'video';
  language: string;
}

interface ApiResponse {
  status: string;
  data: ApiPost[];
  next_cursor?: string | null;
}

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

interface PostsProviderProps {
  children: ReactNode;
}

export const PostsProvider: FC<PostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // deviceId is constant for the client session
  const deviceId = useMemo(() => getDeviceId(), []);

  // prevent duplicate initial fetches when provider remounts or when feed already loaded
  const initializedRef = useRef(false);

  // in-flight request tracking & cancellation
  const inFlightRef = useRef<{ controller?: AbortController; id?: number }>({});
  const requestCounterRef = useRef<number>(0);

  // normalize API data -> Post[]
  const normalizePosts = useCallback(
    (data: ApiPost[]): Post[] => {
      return data.map((apiPost) => ({
        id: String(apiPost.id),
        type: apiPost.type,
        url: apiPost.file_url,
        images: undefined,
        aspectRatio: undefined,
        thumbnail: undefined,
        caption: apiPost.title,
        tags: apiPost.tags
          ? Array.from(
              new Set(
                apiPost.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            )
          : [],
        deviceId, // keep deviceId as a string per Post type
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
      }));
    },
    [deviceId]
  );

  const safeSetPosts = useCallback((updater: (prev: Post[]) => Post[]) => {
    setPosts((prev) => updater(prev));
  }, []);

  const fetchPosts = useCallback(
    async (pageToLoad: number, append: boolean) => {
      // create a new controller for this request
      const requestId = ++requestCounterRef.current;
      const controller = new AbortController();
      inFlightRef.current = { controller, id: requestId };

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/feed/?page=${pageToLoad}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText} ${text}`);
        }

        const response: ApiResponse = await res.json();
        const data = response.data ?? [];

        const normalized = normalizePosts(data);

        safeSetPosts((prev) => {
          if (!append) return normalized;

          const existingIds = new Set(prev.map((p) => p.id));
          const filtered = normalized.filter((p) => !existingIds.has(p.id));
          if (filtered.length === 0) return prev;
          return [...prev, ...filtered];
        });

        setHasMore(normalized.length > 0);
        setPage(pageToLoad);

        // mark initialized when we successfully fetch the first non-append page
        if (!append) {
          initializedRef.current = true;
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // aborted — do nothing
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error while fetching posts';
        setError(message);
        // helpful during development; safe to remove in production
        // eslint-disable-next-line no-console
        console.error('PostsProvider.fetchPosts error:', message);
      } finally {
        // only clear loading/inFlight if this was the latest request
        if (inFlightRef.current.id === requestId) {
          inFlightRef.current = {};
          setLoading(false);
        }
      }
    },
    [deviceId, normalizePosts, safeSetPosts]
  );

  const refresh = useCallback(async () => {
    // cancel current request if any
    try {
      inFlightRef.current.controller?.abort();
    } catch (_) {
      /* ignore */
    }
    await fetchPosts(1, false);
    // ensure initialized after an explicit refresh
    initializedRef.current = true;
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchPosts(nextPage, true);
  }, [fetchPosts, page, loading, hasMore]);

  useEffect(() => {
    // Only perform the initial fetch if we haven't already initialized.
    // This avoids refetching when the provider remounts or when navigating back to the feed.
    if (initializedRef.current) return;

    // If posts are already present (e.g., preserved via provider staying mounted), skip fetch.
    if (posts.length > 0) {
      initializedRef.current = true;
      return;
    }

    fetchPosts(1, false);

    return () => {
      // cleanup on unmount
      try {
        inFlightRef.current.controller?.abort();
      } catch (_) {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPosts]);

  // memoize provider value to avoid unnecessary rerenders
  const contextValue = useMemo(
    () => ({ posts, loading, error, hasMore, refresh, loadMore }),
    [posts, loading, error, hasMore, refresh, loadMore]
  );

  return <PostsContext.Provider value={contextValue}>{children}</PostsContext.Provider>;
};

export const usePosts = (): PostsContextValue => {
  const ctx = useContext(PostsContext);
  if (!ctx) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return ctx;
};
