// PostsContext.tsx
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

interface PostsDataValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

interface PostsActionsValue {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/* Api interfaces unchanged */
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

/* Create two separate contexts */
const PostsDataContext = createContext<PostsDataValue | undefined>(undefined);
const PostsActionsContext = createContext<PostsActionsValue | undefined>(undefined);

interface PostsProviderProps {
  children: ReactNode;
}

export const PostsProvider: FC<PostsProviderProps> = ({ children }) => {
  /* --- state (same as before) --- */
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const deviceId = useMemo(() => getDeviceId(), []);

  const initializedRef = useRef(false);
  const inFlightRef = useRef<{ controller?: AbortController; id?: number }>({});
  const requestCounterRef = useRef<number>(0);

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
        deviceId,
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

  /* --- fetch logic (unchanged) --- */
  const fetchPosts = useCallback(
    async (pageToLoad: number, append: boolean) => {
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

        if (!append) {
          initializedRef.current = true;
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error while fetching posts';
        setError(message);
        // eslint-disable-next-line no-console
        console.error('PostsProvider.fetchPosts error:', message);
      } finally {
        if (inFlightRef.current.id === requestId) {
          inFlightRef.current = {};
          setLoading(false);
        }
      }
    },
    [deviceId, normalizePosts, safeSetPosts]
  );

  /* --- actions (same API) --- */
  const refresh = useCallback(async () => {
    try {
      inFlightRef.current.controller?.abort();
    } catch (_) {}
    await fetchPosts(1, false);
    initializedRef.current = true;
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchPosts(nextPage, true);
  }, [fetchPosts, page, loading, hasMore]);

  /* --- initial fetch --- */
  useEffect(() => {
    if (initializedRef.current) return;
    if (posts.length > 0) {
      initializedRef.current = true;
      return;
    }
    fetchPosts(1, false);
    return () => {
      try {
        inFlightRef.current.controller?.abort();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPosts]);

  /* --- memoized context values (split) --- */
  const dataValue = useMemo(
    () => ({ posts, loading, error, hasMore }),
    [posts, loading, error, hasMore]
  );

  const actionsValue = useMemo(
    () => ({ refresh, loadMore }),
    [refresh, loadMore]
  );

  return (
    <PostsDataContext.Provider value={dataValue}>
      <PostsActionsContext.Provider value={actionsValue}>
        {children}
      </PostsActionsContext.Provider>
    </PostsDataContext.Provider>
  );
};

/* --- hooks for consumers --- */

export const usePostsData = (): PostsDataValue => {
  const ctx = useContext(PostsDataContext);
  if (!ctx) {
    throw new Error('usePostsData must be used within a PostsProvider');
  }
  return ctx;
};

export const usePostsActions = (): PostsActionsValue => {
  const ctx = useContext(PostsActionsContext);
  if (!ctx) {
    throw new Error('usePostsActions must be used within a PostsProvider');
  }
  return ctx;
};

/**
 * Backward-compatible: returns combined shape.
 * Prefer usePostsData/usePostsActions in performance-sensitive components.
 */
export const usePosts = (): PostsDataValue & PostsActionsValue => {
  const data = usePostsData();
  const actions = usePostsActions();
  return { ...data, ...actions };
};
