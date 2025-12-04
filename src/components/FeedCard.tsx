// FeedCard.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Volume2, VolumeX, Maximize2, Play, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { Slider } from './ui/slider';
import { toast } from 'sonner';

interface FeedCardProps {
  post: Post;
  allPosts?: Post[];
  postIndex?: number;
}

function FeedCardInner({ post, allPosts = [], postIndex = 0 }: FeedCardProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // only load media (assign video src / let image load) when card near viewport
  const [loadMedia, setLoadMedia] = useState(false);

  // UI states
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(`bookmark:${post.id}`);
    } catch {
      return false;
    }
  });

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);

  const CHAR_LIMIT = 300;
  const shouldTruncate = post.caption.length > CHAR_LIMIT;
  const hasTags = !!(post.tags && post.tags.length);

  // Observe the card container and enable media loading when within rootMargin
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // if already loading media, no need to observe
    if (loadMedia) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadMedia(true);
            io.disconnect();
          }
        });
      },
      { root: null, rootMargin: '300px', threshold: 0.01 }
    );

    io.observe(el);
    visibilityObserverRef.current = io;

    return () => {
      io.disconnect();
      visibilityObserverRef.current = null;
    };
  }, [loadMedia]);

  // Pause video when the card leaves view (observe container not video)
  useEffect(() => {
    if (post.type !== 'video' || !containerRef.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -20% 0px' }
    );

    io.observe(containerRef.current);
    return () => io.disconnect();
  }, [post.type]);

  // Sync muted state with video element whenever it exists
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Attach video event listeners when video is present
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setDuration(isFinite(v.duration) ? v.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    // ensure muted state consistent
    v.muted = isMuted;

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [isMuted, loadMedia]); // re-run when src assigned (loadMedia) or mute toggles

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isPlaying && showControls) resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [isPlaying, showControls, resetControlsTimer]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, []);

  const togglePlay = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const v = videoRef.current;
      if (!v) return;

      if (v.paused) {
        v.play().catch(() => {
          // play failed (autoplay blocked etc) — keep controls visible
          setShowControls(true);
        });
        setIsPlaying(true);
        setShowControls(true);
        resetControlsTimer();
      } else {
        v.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    },
    [resetControlsTimer]
  );

  const handleSeek = useCallback(
    (value: number[]) => {
      const t = Math.max(0, Math.min((value && value[0]) || 0, duration || Infinity));
      if (videoRef.current) videoRef.current.currentTime = t;
      setCurrentTime(t);
      setShowControls(true);
      resetControlsTimer();
    },
    [duration, resetControlsTimer]
  );

  const handleMuteToggle = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setIsMuted((prev) => {
        const next = !prev;
        if (videoRef.current) videoRef.current.muted = next;
        setShowControls(true);
        resetControlsTimer();
        return next;
      });
    },
    [resetControlsTimer]
  );

  const handleFullscreenClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (post.type !== 'video') return;
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setIsFullscreenOpen(true);
    },
    [post.type]
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch(post.url, { mode: 'cors' });
        if (!res.ok) throw new Error('Network response was not ok');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memeverse-${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Download started!');
      } catch {
        try {
          window.open(post.url, '_blank', 'noopener');
          toast.success('Opened in new tab — right-click > Save if needed.');
        } catch {
          toast.error('Download failed. Please try again.');
        }
      }
    },
    [post.id, post.type, post.url]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/reels/${post.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ url, title: post.caption });
          toast.success('Shared!');
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        } else {
          const temp = document.createElement('textarea');
          temp.value = url;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          toast.success('Link copied to clipboard!');
        }
      } catch {
        toast.error('Unable to share. Try copying the link manually.');
      }
    },
    [post.id, post.caption]
  );

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const next = !isBookmarked;
        setIsBookmarked(next);
        if (next) {
          localStorage.setItem(`bookmark:${post.id}`, '1');
          toast.success('Added to bookmarks');
        } else {
          localStorage.removeItem(`bookmark:${post.id}`);
          toast.success('Removed from bookmarks');
        }
      } catch {
        setIsBookmarked((s) => !s);
        toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
      }
    },
    [isBookmarked, post.id]
  );

  return (
    <div ref={containerRef} className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md hover:border-white/10 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center">
          <span className="text-xs">{post.deviceId.slice(-2)}</span>
        </div>
        <div>
          <p className="text-sm">Device {post.deviceId}</p>
          <p className="text-xs text-[#6B6B7B]">{formatNumber(post.views)} views</p>
        </div>
      </div>

      {/* Media */}
      {post.type === 'image' ? (
        post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} alt={post.caption} />
        ) : (
          <div className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden">
            <ImageWithFallback
              src={post.thumbnail || post.url}
              alt={post.caption}
              className="w-full h-full object-cover"
              loading="lazy"
              lqip={post.lqip || undefined}
            />
          </div>
        )
      ) : (
        <div
          className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden cursor-pointer group"
          onClick={(e) => togglePlay(e)}
          onMouseEnter={() => { setShowControls(true); resetControlsTimer(); }}
          onMouseMove={() => { setShowControls(true); resetControlsTimer(); }}
          onMouseLeave={() => { /* let timer hide controls */ }}
        >
          <video
            ref={videoRef}
            src={loadMedia ? post.url : undefined}
            poster={post.thumbnail || undefined}
            preload={loadMedia ? 'metadata' : 'none'}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Center Play Button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)] scale-100 hover:scale-110 transition-transform border border-white/20 backdrop-blur-sm group-hover:scale-105">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
              <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium backdrop-blur-sm border border-white/10">
                {formatTime(duration || 0)}
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end transition-opacity duration-500 ${isPlaying && showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 w-full space-y-2 pointer-events-auto">
              <div className="w-full px-1">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:w-3 [&_[data-slot=slider-thumb]]:h-3 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:ring-0"
                />
              </div>

              <div className="flex items-center justify-between relative z-30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
                    className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-md border border-white/10"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>

                  <div className="text-xs text-white/90 font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <button
                  onClick={handleFullscreenClick}
                  className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-md border border-white/10 z-30 relative"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-4 pb-2">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 text-sm transition-colors p-2 ${isBookmarked ? 'text-[#00A8FF]' : 'text-[#6B6B7B] hover:text-[#00A8FF]'}`}
          title="Bookmark"
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-[#00A8FF]' : ''}`} />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm text-[#6B6B7B] hover:text-[#6C5CE7] transition-colors p-2"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 text-sm text-[#6B6B7B] hover:text-[#00A8FF] transition-colors p-2"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Caption & Tags */}
      <div className="px-4 py-3">
        <div className="text-sm text-gray-200">
          {shouldTruncate && !showFullCaption ? (
            <div className="relative">
              <div className="overflow-hidden line-clamp-2">
                <span className="leading-relaxed">{post.caption}</span>
              </div>
              <button onClick={() => setShowFullCaption(true)} className="text-[#6B6B7B] hover:text-[#6C5CE7] text-xs mt-1 font-medium">
                See more
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 leading-relaxed">{post.caption}</div>
              {hasTags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-[#1E1E2E] text-xs text-[#00A8FF] border border-[#00A8FF]/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {post.type === 'video' && (
        <FullscreenVideoModal
          isOpen={isFullscreenOpen}
          onClose={(finalTime?: number, resume?: boolean) => {
            setIsFullscreenOpen(false);
            if (finalTime !== undefined && videoRef.current) {
              videoRef.current.currentTime = finalTime;
            }
            if (resume && videoRef.current) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }}
          videoUrl={post.url}
          initialTime={videoRef.current?.currentTime || 0}
          autoPlay={true}
        />
      )}
    </div>
  );
}

// Memoize to prevent re-renders unless props change
export const FeedCard = React.memo(FeedCardInner);
export default FeedCard;
