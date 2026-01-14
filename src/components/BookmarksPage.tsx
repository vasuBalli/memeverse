"use client"
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FeedCard } from './FeedCard';
import { Bookmark, Ghost } from 'lucide-react';
import { useStore } from '../context/StoreContext';

import { Post } from '@/data/mockData';

import Link from 'next/link';

export function BookmarksPage() {
  const { bookmarks } = useStore();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);

  // useEffect(() => {
  //   const saved = mockPosts.filter(post => bookmarks.includes(post.id));
  //   setBookmarkedPosts(saved);
  // }, [bookmarks]);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-[#15151F] border border-white/10">
          <Bookmark className="w-6 h-6 text-[#6C5CE7]" />
        </div>
        <div>
          <h2 className="gradient-text text-2xl font-bold">Saved Posts</h2>
          <p className="text-[#6B6B7B] text-sm mt-1">
            {bookmarks.length} posts saved for later
          </p>
        </div>
      </div>

      {bookmarkedPosts.length > 0 ? (
        <div className="space-y-6">
          {bookmarkedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FeedCard post={post} allPosts={bookmarkedPosts} postIndex={index} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#15151F] flex items-center justify-center mb-6">
            <Ghost className="w-10 h-10 text-[#6B6B7B]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No saved posts yet</h3>
          <p className="text-[#6B6B7B] max-w-xs mx-auto mb-8">
            Bookmark posts you like to watch them later. They will appear here.
          </p>
          <Link 
            href="/feed"
            className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors"
          >
            Explore Feed
          </Link>
        </div>
      )}
    </main>
  );
}
