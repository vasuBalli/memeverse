// pages/SinglePostPage.tsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedCard from '../components/FeedCard';
import { Post } from '../data/mockData';
import { getDeviceId } from '../components/utils/deviceId';

function normalizePostFromApi(data: any): Post {
  return {
    id: data.id,
    type: data.type,
    url: data.file_url,
    thumbnail: data.thumbnail ?? '',
    images: [],

    caption: data.title ?? '',
    tags: data.tags ?? [],

    likes: data.likes_count ?? 0,
    views: data.views_count ?? 0,
    comments: 0,
    shares: 0,

    deviceId: data.user_name ?? 'Unknown',

    // 🔑 REQUIRED FLAGS (WERE MISSING)
    is_liked: data.is_liked ?? false,
    is_bookmarked: data.is_bookmarked ?? false,
  };
}

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

        const res = await fetch(
          `/api/post-details/?post_id=${postId}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );

        const json = await res.json();
        if (!json?.data) throw new Error('Invalid response');

        const normalized = normalizePostFromApi(json.data);
        setPost(normalized);
      } catch (err) {
        console.error('Failed to load post', err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // ✅ Track view separately (NO CACHE, NO 304)
  useEffect(() => {
    if (!postId) return;

    fetch('/api/view/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meme_id: postId,
        device_id: getDeviceId(),
      }),
    }).catch(() => {});
  }, [postId]);

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

        {/* 🔥 RENDERS CORRECTLY NOW */}
        <FeedCard post={post} context='single' />
      </div>
    </div>
  );
}
