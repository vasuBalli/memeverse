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
import { Post } from '../data/mockData';
import { useDevice } from './DeviceContext';

/* ---------- Types ---------- */

type PostInteraction = {
  is_liked: boolean;
  is_bookmarked: boolean;
};

interface PostsDataValue {
  posts: Post[];
  interactions: Record<string, PostInteraction>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

interface PostsActionsValue {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateInteraction: (postId: string, patch: Partial<PostInteraction>) => void;
}

interface ApiPost {
  id: number;
  title: string;
  file_url: string;
  tags: string[];
  user_name: string;
  created_at: string;
  type: 'image' | 'video';
  language: string;
  thumbnail?: string;
  poster?: string;
  lqip?: string;
  likes_count: number;
}

interface ApiResponse {
  status: string;
  data: ApiPost[];
}

/* ---------- Contexts ---------- */

const PostsDataContext = createContext<PostsDataValue | undefined>(undefined);
const PostsActionsContext = createContext<PostsActionsValue | undefined>(undefined);

interface PostsProviderProps {
  children: ReactNode;
}

/* ---------- Provider ---------- */

export const PostsProvider: FC<PostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [interactions, setInteractions] = useState<Record<string, PostInteraction>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { deviceId, isNewDevice } = useDevice();

  const initializedRef = useRef(false);
  const requestCounterRef = useRef(0);
  const inFlightRef = useRef<{ controller?: AbortController; id?: number }>({});

  /* ---------- Normalizer ---------- */
  const normalizePosts = useCallback((data: ApiPost[]): Post[] => {
    return data.map((apiPost) => ({
      id: String(apiPost.id),
      type: apiPost.type,
      url: apiPost.file_url,
      title: apiPost.title,

      caption: apiPost.title ?? '',
      tags: Array.isArray(apiPost.tags) ? apiPost.tags : [],

      likes: apiPost.likes_count ?? 0,
      views: 0,
      comments: 0,
      shares: 0,

      deviceId: apiPost.user_name ?? 'Unknown',

      images: [],
      thumbnail: apiPost.thumbnail,
      poster: apiPost.poster,
      lqip: apiPost.lqip,
    }));
  }, []);

  /* ---------- Safe setters ---------- */

  const safeSetPosts = useCallback((updater: (prev: Post[]) => Post[]) => {
    setPosts((prev) => updater(prev));
  }, []);

  // const ensureInteractions = useCallback((posts: Post[]) => {
  //   setInteractions((prev) => {
  //     const next = { ...prev };

  //     for (const post of posts) {
  //       if (!next[post.id]) {
  //         next[post.id] = {
  //           is_liked: false,
  //           is_bookmarked: false,
  //         };
  //       }
  //     }

  //     return next;
  //   });
  // }, []);

//   const ensureInteractions = useCallback((posts: Post[]) => {
//   setInteractions((prev) => {
//     const next = { ...prev };

//     for (const post of posts) {
//       if (!(post.id in next)) {
//         next[post.id] = {
//           is_liked: false,
//           is_bookmarked: false,
//         };
//       }
//     }

//     return next;
//   });
// }, []);

const ensureInteractions = useCallback((posts: Post[]) => {
  setInteractions((prev) => {
    let changed = false;
    const next = { ...prev };

    for (const post of posts) {
      if (next[post.id] === undefined) {
        next[post.id] = {
          is_liked: false,
          is_bookmarked: false,
        };
        changed = true;
      }
    }

    return changed ? next : prev;
  });
}, []);

  /* ---------- Fetch Posts ---------- */

  const fetchPosts = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (!deviceId) return;

      const requestId = ++requestCounterRef.current;
      const controller = new AbortController();
      inFlightRef.current = { controller, id: requestId };

      try {
        setLoading(true);
        setError(null);

        const url = isNewDevice
          ? `/api/feed/?page=${pageToLoad}&device_id=${deviceId}`
          : `/api/feed/?page=${pageToLoad}`;

        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to fetch posts: ${res.status} ${text}`);
        }

        const response: ApiResponse = await res.json();
        const normalized = normalizePosts(response.data ?? []);

        safeSetPosts((prev) => {
          if (!append) return normalized;

          const existingIds = new Set(prev.map((p) => p.id));
          const filtered = normalized.filter((p) => !existingIds.has(p.id));
          return filtered.length ? [...prev, ...filtered] : prev;
        });

        ensureInteractions(normalized);

        setHasMore(normalized.length > 0);
        setPage(pageToLoad);

        if (!append) {
          initializedRef.current = true;
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('PostsProvider.fetchPosts error:', message);
      } finally {
        if (inFlightRef.current.id === requestId) {
          inFlightRef.current = {};
          setLoading(false);
        }
      }
    },
    [deviceId, isNewDevice, normalizePosts, safeSetPosts, ensureInteractions]
  );

  /* ---------- Actions ---------- */

  const refresh = useCallback(async () => {
    inFlightRef.current.controller?.abort();
    initializedRef.current = false;
    await fetchPosts(1, false);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchPosts(page + 1, true);
  }, [fetchPosts, page, loading, hasMore]);

  const updateInteraction = useCallback(
    (postId: string, patch: Partial<PostInteraction>) => {
      setInteractions((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] ?? { is_liked: false, is_bookmarked: false }),
          ...patch,
        },
      }));
    },
    []
  );

  /* ---------- Initial Fetch ---------- */

  useEffect(() => {
    if (!deviceId) return;
    if (initializedRef.current) return;

    fetchPosts(1, false);
  }, [deviceId, fetchPosts]);

  /* ---------- Context Values ---------- */

  const dataValue = useMemo(
    () => ({ posts, interactions, loading, error, hasMore }),
    [posts, interactions, loading, error, hasMore]
  );

  const actionsValue = useMemo(
    () => ({ refresh, loadMore, updateInteraction }),
    [refresh, loadMore, updateInteraction]
  );

  return (
    <PostsDataContext.Provider value={dataValue}>
      <PostsActionsContext.Provider value={actionsValue}>
        {children}
      </PostsActionsContext.Provider>
    </PostsDataContext.Provider>
  );
};

/* ---------- Hooks ---------- */

export const usePostsData = (): PostsDataValue => {
  const ctx = useContext(PostsDataContext);
  if (!ctx) throw new Error('usePostsData must be used within PostsProvider');
  return ctx;
};

export const usePostsActions = (): PostsActionsValue => {
  const ctx = useContext(PostsActionsContext);
  if (!ctx) throw new Error('usePostsActions must be used within PostsProvider');
  return ctx;
};

export const usePosts = (): PostsDataValue & PostsActionsValue => {
  return { ...usePostsData(), ...usePostsActions() };
};
