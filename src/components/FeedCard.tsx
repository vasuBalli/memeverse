// src/components/FeedCard.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
} from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';

interface FeedCardProps {
  post: Post;
  allPosts?: Post[];
  postIndex?: number;
}

/**
 * FeedCard — final version with playback coordination
 * - registers player with VideoSoundProvider
 * - calls announcePlay(post.id, videoEl) before playing
 * - calls announcePause(post.id) on pause/unmount
 * - fixed-height Instagram-like media box, object-contain
 */
export const FeedCard: React.FC<FeedCardProps> = memo(function FeedCard({
  post,
}) {
  const { videoRef, shouldLoad } = useLazyVideo();
  const {
    isMuted,
    toggleMute,
    registerPlayer,
    unregisterPlayer,
    announcePlay,
    announcePause,
  } = useVideoSound();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Register/unregister video element with provider for coordinated control
  useEffect(() => {
    const id = post.id;
    const el = videoRef.current ?? null;
    if (el) {
      registerPlayer(id, el);
    }
    return () => {
      // on unmount, unregister and announce pause to clear active if needed
      try {
        announcePause(id);
      } catch {
        /* ignore */
      }
      unregisterPlayer(id);
    };
    // Note: we intentionally include the functions so effect updates when refs change
  }, [post.id, registerPlayer, unregisterPlayer, videoRef, announcePause]);

  // Ensure video element follows global mute setting
  useEffect(() => {
    if (!videoRef.current) return;
    try {
      videoRef.current.muted = isMuted;
    } catch {
      /* ignore */
    }
  }, [isMuted, videoRef]);

  // Pause video on unmount to avoid background playback (virtualization safety)
  useEffect(() => {
    return () => {
      try {
        videoRef.current?.pause();
        if (videoRef.current) {
          announcePause(post.id);
        }
      } catch {
        /* ignore */
      }
    };
  }, [videoRef, post.id, announcePause]);

  // Image load handler (keeps original logic available if needed)
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // placeholder: you can compute aspect if needed
    // const img = e.currentTarget;
    // if (img.naturalWidth && img.naturalHeight) { ... }
  }, []);

  // Single-click play/pause — announcePlay is awaited before calling .play()
  const onMediaClick = useCallback(
    async (e?: React.MouseEvent) => {
      if (post.type !== 'video' || !videoRef.current) return;
      e?.stopPropagation();

      try {
        if (videoRef.current.paused) {
          // Tell provider which element will play so it can pause others and start observing visibility.
          await announcePlay(post.id, videoRef.current);

          const p = videoRef.current.play();
          if (p instanceof Promise) {
            await p.catch(() => {
              /* ignore play errors (autoplay restrictions) */
            });
          }
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          try {
            announcePause(post.id);
          } catch {
            /* ignore */
          }
          setIsPlaying(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('video play error', err);
      }
    },
    [post.id, post.type, videoRef, announcePlay, announcePause]
  );

  // Mute toggle uses global toggle
  const handleMuteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleMute();
      // the provider will sync mute to registered players
    },
    [toggleMute]
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
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
      } catch (err) {
        toast.error('Download failed. Please try again.');
      }
    },
    [post.url, post.id, post.type]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/reels/${post.id}`;
      navigator.clipboard?.writeText(url);
      toast.success('Link copied to clipboard!');
    },
    [post.id]
  );

  return (
    <article className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md transition-all relative z-0">
      {/* Header (compact) */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center text-xs font-medium"
          aria-hidden
        >
          {String(post.deviceId).slice(-2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">Device {post.deviceId}</span>
            <span className="text-xs text-[#6B6B7B]">• {formatNumber(post.views)} views</span>
          </div>
        </div>

        <button className="p-1 rounded-md text-[#A0A0B0] hover:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {/* Media container: fixed box like Instagram posts */}
      <div
        ref={containerRef}
        className="w-full bg-black flex items-center justify-center overflow-hidden"
        style={{ height: 480 }} // Instagram-like fixed height; adjust if you want responsive variants
        onClick={onMediaClick}
      >
        
          <div className="relative flex items-center justify-center w-full h-full">
            {post.type === 'image' ? (
              <img
                src={post.url}
                alt={post.caption}
                onLoad={onImageLoad}
                className="block max-w-full max-h-full"
                style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={shouldLoad ? post.url : undefined}
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  poster={post.thumbnail}
                  className="block max-w-full max-h-full"
                  style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                />
                {/* Mute button for videos */}
                <button
                  onClick={handleMuteClick}
                  className="absolute bottom-0 right-3 w-10 h-10 rounded-full glass flex items-center justify-center z-20"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </>
            )}
          </div>


        {/* Play overlay when paused */}
        {post.type === 'video' && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-12 h-12 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute button */}
        
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
        <button onClick={handleDownload} className="flex items-center gap-2 group">
          <Download className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#00A8FF] transition-colors" />
          <span className="text-sm text-[#A0A0B0]">Download</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 group ml-auto"
        >
          <Share2 className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#6C5CE7] transition-colors" />
          <span className="text-sm text-[#A0A0B0]">Share</span>
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="text-sm mb-2 line-clamp-3">{post.caption}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="px-2 py-0.5 rounded-full bg-[#111214] text-xs text-[#00A8FF] border border-[#00A8FF]/20"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});
