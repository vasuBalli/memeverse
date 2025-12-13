// pages/SinglePostPage.tsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedCard from '../components/FeedCard';
import { Post } from '../data/mockData';

export default function SinglePostPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const postId = params.get('post_id');
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/post-details/?post_id=${postId}`);
        const json = await res.json();

        const data = json?.data;
        if (!data) throw new Error('Invalid API response');

        // ✅ NORMALIZE API RESPONSE → FeedCard Post
        const normalizedPost: Post = {
          id: data.id ?? postId,
          type: data.type ?? 'image',
          url: data.file_url,                 // 👈 IMPORTANT
          thumbnail: data.thumbnail ?? '',
          images: [],                          // single media post
          caption: data.title ?? '',
          tags: data.tags ?? [],
          likes: 0,
          views: 0,
          comments: 0,
          shares: 0,
          deviceId: data.user_name ?? 'Unknown',
          lqip: undefined,
        };

        setPost(normalizedPost);
      } catch (err) {
        console.error('Failed to load post', err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // ---------- UI ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-[#6B6B7B]">
        Loading…
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-red-400">
        Post not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex justify-center">
      <div className="max-w-md w-full p-3">
        <button
          onClick={() => navigate('/', { replace: true })}
          className="mb-3 text-sm text-[#6B6B7B] hover:text-white"
        >
          ← Back
        </button>

        <FeedCard post={post} />
      </div>
    </div>
  );
}
