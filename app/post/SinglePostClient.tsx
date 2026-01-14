'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FeedCard } from '@/components/FeedCard';

export default function SinglePostClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const postId = searchParams.get('post_id');
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/post-details/?post_id=${postId}`,
          { cache: 'no-store' }
        );

        const json = await res.json();
        if (!json?.data) throw new Error('Invalid response');

        const normalizedPost = {
          id: json.data.id,
          type: json.data.type,

          file_url: json.data.file_url,
          title: json.data.title ?? '',

          thumbnail: json.data.thumbnail ?? '',
          tags: json.data.tags ?? [],

          likes: json.data.likes_count ?? 0,
          views: json.data.views_count ?? 0,
          comments: 0,
          shares: 0,

          deviceId: json.data.user_name ?? 'Unknown',

          is_liked: json.data.is_liked ?? false,
          is_bookmarked: json.data.is_bookmarked ?? false,
        };

        setPost(normalizedPost);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Post not found
      </div>
    );

  return (
    <div className="min-h-screen flex justify-center bg-[#0A0A0F]">
      <div className="max-w-md w-full p-3">
        <button
          onClick={() => router.push('/')}
          className="mb-3 text-sm text-gray-400"
        >
          ← Back
        </button>

        <FeedCard post={post} context="single" />
      </div>
    </div>
  );
}
