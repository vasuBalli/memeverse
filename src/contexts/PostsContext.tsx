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
  refresh: () => Promise<void>;
}

interface ApiPost {
  id: number;
  title: string;
  file_url: string;
  tags: string; // comma-separated string from API
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const deviceId = getDeviceId();

      const res = await fetch('/api/memes/', {
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }

      const response: ApiResponse = await res.json();

      // ✅ Your array is response.data
      const data = response.data ?? [];

      const normalized: Post[] = data.map((apiPost) => ({
        id: String(apiPost.id),                // Post.id is string, API id is number
        type: apiPost.type,                   // 'image' | 'video'
        url: apiPost.file_url,                // map backend file_url → url
        images: undefined,                    // not provided for now
        aspectRatio: undefined,               // could be computed later
        thumbnail: undefined,                 // could be derived if needed
        caption: apiPost.title,               // use title as caption
        tags: apiPost.tags
          ? apiPost.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        deviceId,
        likes: 0,                             // backend doesn't send; default 0
        comments: 0,
        shares: 0,
        views: 0,
      }));

      setPosts(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error while fetching posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <PostsContext.Provider value={{ posts, loading, error, refresh: fetchPosts }}>
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
