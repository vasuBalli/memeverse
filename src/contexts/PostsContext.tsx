import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
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
}

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

interface PostsProviderProps {
  children: ReactNode;
}

export const PostsProvider: React.FC<PostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPosts = useCallback(
    async (pageToLoad: number, append: boolean) => {
      try {
        setLoading(true);
        setError(null);

        const deviceId = getDeviceId();

        const res = await fetch(`/api/feed/?page=${pageToLoad}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch posts: ${res.status}`);
        }

        const response: ApiResponse = await res.json();
        const data = response.data ?? [];

        const normalized: Post[] = data.map((apiPost) => ({
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

        setPosts((prev) => (append ? [...prev, ...normalized] : normalized));
        setHasMore(normalized.length > 0);
        setPage(pageToLoad);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error while fetching posts';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchPosts(1, false);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchPosts(page + 1, true);
  }, [fetchPosts, page, loading, hasMore]);

  useEffect(() => {
    // initial load
    fetchPosts(1, false);
  }, [fetchPosts]);

  // 🔴 IMPORTANT: this must RETURN JSX
  return (
    <PostsContext.Provider
      value={{ posts, loading, error, hasMore, refresh, loadMore }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = (): PostsContextValue => {
  const ctx = useContext(PostsContext);
  if (!ctx) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return ctx;
};
