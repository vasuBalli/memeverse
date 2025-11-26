// src/components/FeedCard.tsx
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';
import { Menu, MenuItem } from './ui/menu';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../contexts/PostsContext';
import { TruncatedText } from './TruncatedText';

interface FeedCardProps {
  post: Post;
}

export const FeedCard: React.FC<FeedCardProps> = memo(function FeedCard({ post }) {
  const { videoRef, shouldLoad } = useLazyVideo();
  const { registerPlayer, unregisterPlayer, announcePause, announcePlay } = useVideoSound();
  const { posts } = usePosts();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // register for coordinated pause/play when mounted (still helpful for feedplayer)
  useEffect(() => {
    const id = post.id;
    const el = videoRef.current ?? null;
    if (el) registerPlayer(id, el);
    return () => {
      try {
        announcePause(id);
      } catch {}
      unregisterPlayer(id);
    };
  }, [post.id, registerPlayer, unregisterPlayer, videoRef, announcePause]);

  // open full-screen feed viewer (acts like Reel viewer)
  const openFeedViewer = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      // pass posts and initialIndex so viewer can build the list quickly
      const initialIndex = posts.findIndex((p) => p.id === post.id);
      navigate(`/feed/${post.id}`, { state: { posts, initialIndex } });
    },
    [navigate, posts, post.id]
  );

  // move download/share into menu: simple utility functions
  const handleDownload = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const response = await fetch(post.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memeverse-${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  }, [post.url, post.id, post.type]);

  const handleShare = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/feed/${post.id}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied to clipboard!');
  }, [post.id]);

  // caption truncation toggling
  const captionShort = post.caption || '';
  const showMoreToggle = captionShort.length > 120;

  return (
    <article className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md transition-all relative z-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center text-xs font-medium" aria-hidden>
          {String(post.deviceId).slice(-2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">Device {post.deviceId}</span>
            <span className="text-xs text-[#6B6B7B]">• {formatNumber(post.views)} views</span>
          </div>
        </div>

        {/* Three-dot menu (Download / Share moved here) */}
        <Menu>
          <MenuItem onClick={handleDownload} icon={<Download className="w-4 h-4" />}>Download</MenuItem>
          <MenuItem onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>Share</MenuItem>
          <MenuItem onClick={() => toast('Reported (placeholder)')} icon={<svg width="14" height="14"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.2" /></svg>}>Report</MenuItem>
        </Menu>
      </div>

      {/* Media container: clicking opens FeedViewer */}
      <div
        ref={containerRef}
        className="w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ height: 480 }}
        onClick={openFeedViewer}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          {post.type === 'image' ? (
            <img
              src={post.url}
              alt={post.caption}
              loading="lazy"
              className="block max-w-full max-h-full"
              style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <video
              ref={videoRef}
              src={shouldLoad ? post.url : undefined}
              playsInline
              muted
              preload="metadata"
              poster={post.thumbnail}
              className="block max-w-full max-h-full"
              style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>

      {/* Actions bar removed; three-dot contains actions */}
      <div className="px-4 pb-4 ">
        {/* <p className={`text-sm mb-2 ${isExpanded ? '' : 'line-clamp-1'}`}>
          {isExpanded ? post.caption : post.caption}
          {showMoreToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((s) => !s);
              }}
              className="ml-2 text-xs text-[#00A8FF]"
            >
              {isExpanded ? 'See less' : 'See more'}
            </button>
          )}
        </p> */}

        {/* <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 6).map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="px-2 py-0.5 rounded-full bg-[#111214] text-xs text-[#00A8FF] border border-[#00A8FF]/20">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div> */}
        <div className="px-4 pb-4 mt-[5rem]" style={{ marginTop: '0.7rem' }}>
              <TruncatedText text={post.caption} lines={1} className="text-sm mb-2 text-white" />
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 6).map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="px-2 py-0.5 rounded-full bg-[#111214] text-xs text-[#00A8FF] border border-[#00A8FF]/20">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
      </div>
    </article>
  );
});
