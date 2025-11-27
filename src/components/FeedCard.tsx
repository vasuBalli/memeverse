// src/components/FeedCard.tsx
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
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
  const { registerPlayer, unregisterPlayer, announcePause, announcePlay, isMuted, toggleMute } = useVideoSound();
  const { posts } = usePosts();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 100
  const [duration, setDuration] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // register/unregister
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  // sync play/pause state from video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      if (!v.duration || Number.isNaN(v.duration)) {
        setProgress(0);
        return;
      }
      if (!isScrubbing) {
        setProgress((v.currentTime / v.duration) * 100);
      }
    };
    const onLoaded = () => setDuration(v.duration || null);

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [videoRef, post.type, isScrubbing]);

  // toggle play/pause (single click or control)
  const togglePlay = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const v = videoRef.current;
      if (!v || post.type !== 'video') return;
      if (v.paused) {
        try {
          await announcePlay(post.id, v);
          v.muted = isMuted;
          await v.play().catch(() => {});
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      } else {
        v.pause();
        try {
          announcePause(post.id);
        } catch {}
        setIsPlaying(false);
      }
    },
    [post.id, announcePlay, announcePause, isMuted]
  );

  // seek by percent
  const seekToPct = useCallback((pct: number) => {
    const v = videoRef.current;
    if (!v || post.type !== 'video' || !v.duration || Number.isNaN(v.duration)) return;
    v.currentTime = (pct / 100) * v.duration;
    setProgress(pct);
  }, [post.type]);

  // scrub handlers
  const onScrubStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScrubbing(true);
  }, []);

  const onScrubEnd = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIsScrubbing(false);
    const pct = Number((e.target as HTMLInputElement).value);
    seekToPct(pct);
  }, [seekToPct]);

  const onScrubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const pct = Number(e.target.value);
    setProgress(pct);
  }, []);

  // open single feed viewer (standalone)
  const openFeedViewerSingle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/feed/${post.id}`, { state: { single: true, post } });
  }, [navigate, post]);

  // mute toggle (stop propagation so click doesn't toggle play)
  const onMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  }, [toggleMute]);

  // fullscreen button opens player (stopPropagation)
  const onFullscreenClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openFeedViewerSingle(e);
  }, [openFeedViewerSingle]);

  // share from inline control (stopPropagation)
  const onShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/feed/${post.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        toast.success('Link copied to clipboard!');
      }
    } catch {
      toast.error('Copy failed');
    }
  }, [post.id]);

  // helper: format seconds to mm:ss
  const formatTimeFromPct = (sPct: number) => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return '0:00';
    const t = (sPct / 100) * v.duration;
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const totalDurationText = () => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return '0:00';
    const m = Math.floor(v.duration / 60);
    const sec = Math.floor(v.duration % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <article
      className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md transition-all relative z-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
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

        {/* Three-dot menu */}
        <div onClick={(e) => e.stopPropagation()}>
          <Menu>
            <MenuItem onClick={async (e?: any) => {
              e?.stopPropagation();
              try {
                const resp = await fetch(post.url);
                const blob = await resp.blob();
                const u = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = u;
                a.download = `memeverse-${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(u), 1500);
                toast.success('Download started!');
              } catch {
                toast.error('Download failed');
              }
            }} icon={<Download className="w-4 h-4" />}>Download</MenuItem>

            <MenuItem onClick={(e?: any) => { e?.stopPropagation(); onShareClick(e); }} icon={<Share2 className="w-4 h-4" />}>Share</MenuItem>
            <MenuItem onClick={() => toast('Reported (placeholder)')} icon={<svg width="14" height="14"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.2" /></svg>}>Report</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Media container */}
      <div
        ref={containerRef}
        className="w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer relative"
        style={{ height: 480 }}
        onClick={(e) => {
          // clicking main toggles play/pause
          togglePlay(e);
        }}
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

          {/* Controls overlay (visible on hover) */}
          <div className={`absolute inset-0 transition-opacity ${hover ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Bottom area containing scrubber, time, and controls */}
            <div className="absolute left-0 right-0 bottom-0 px-3">
              {/* Scrubber row: play/pause at left, thin scrub, time at right */}
              <div className="flex items-center gap-3">
                {/* play/pause at left */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(e); }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="w-9 h-9 rounded-full glass flex items-center justify-center"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>

                {/* thinner scrubber */}
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onMouseDown={onScrubStart}
                    onTouchStart={onScrubStart}
                    onChange={onScrubChange}
                    onMouseUp={onScrubEnd as any}
                    onTouchEnd={onScrubEnd as any}
                    aria-label="Seek"
                    className="thin-range w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* combined timer current / total */}
                <div className="flex-shrink-0 text-xs text-white/80 w-[90px] text-right">
                  <span>{formatTimeFromPct(progress)}</span>
                  <span className="mx-1">/</span>
                  <span>{totalDurationText()}</span>
                </div>
              </div>

              {/* Buttons row below scrubber: right: mute, fullscreen, share */}
              <div className="mt-2 flex items-center justify-end left-5 gap-2 pr-1">
                <button
                  onClick={onMuteClick}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={onFullscreenClick}
                  aria-label="Open player"
                  className="w-9 h-9 rounded-full glass flex items-center justify-center"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onShareClick(e); }}
                  aria-label="Share"
                  className="w-9 h-9 rounded-full glass flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* caption + tags area (unchanged layout) */}
      <div className="px-4 pb-4 mt-[.7rem]">
        <TruncatedText text={post.caption} lines={1} className="text-sm mb-2 text-white" />
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 6).map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="px-2 py-0.5 rounded-full bg-[#111214] text-xs text-[#00A8FF] border border-[#00A8FF]/20">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        /* thin range for smaller visual width and height */
        .thin-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px; /* decreased height */
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
        }
        .thin-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6C5CE7;
          box-shadow: 0 0 0 6px rgba(108,92,231,0.12);
        }
        .thin-range::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6C5CE7;
        }
      `}</style>
    </article>
  );
});
