// src/components/FeedCard.tsx
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';
import { Menu, MenuItem } from './ui/menu';
import { useNavigate } from 'react-router-dom';
import { TruncatedText } from './TruncatedText';

interface FeedCardProps {
  post: Post;
  index?: number; // optional index for virtualization restore
}

export const FeedCard: React.FC<FeedCardProps> = memo(function FeedCard({ post, index }) {
  const { videoRef, shouldLoad } = useLazyVideo();
  const { registerPlayer, unregisterPlayer, announcePause, announcePlay, isMuted, toggleMute } = useVideoSound();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const lastTimeUpdateRef = useRef(0);
  const [hover, setHover] = useState(false); // overlay visibility
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 100
  const [duration, setDuration] = useState<number | null>(null);

  // detect touch devices where :hover isn't available
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (window.matchMedia && window.matchMedia('(hover: none)').matches));

  // register/unregister (register once when video element available)
  useEffect(() => {
    const id = post.id;
    const el = videoRef.current ?? null;
    if (el) {
      try {
        registerPlayer(id, el);
      } catch {}
    }
    return () => {
      try {
        announcePause(id);
      } catch {}
      try {
        unregisterPlayer(id);
      } catch {}
    };
    // only depends on post.id (videoRef.current handled in other effects)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  // Attach video listeners to current element and throttle time updates
  useEffect(() => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;

    const onPlay = () => {
      setIsPlaying(true);
      if (isTouchDevice) {
        if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = window.setTimeout(() => setHover(false), 2000);
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      if (isTouchDevice) setHover(true);
    };
    const onTime = () => {
      // throttle to ~150ms
      const now = performance.now();
      if (now - lastTimeUpdateRef.current < 150) return;
      lastTimeUpdateRef.current = now;

      if (!v.duration || Number.isNaN(v.duration)) {
        setProgress(0);
        return;
      }
      if (!isScrubbingRef.current) {
        setProgress((v.currentTime / v.duration) * 100);
      }
    };
    const onLoaded = () => {
      setDuration(v.duration || null);
      if (v.duration && !Number.isNaN(v.currentTime)) {
        setProgress((v.currentTime / v.duration) * 100);
      }
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);

    // sync mute
    v.muted = isMuted;

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
    // intentionally depend on v (videoRef.current) so handlers reattach on element changes
  }, [videoRef.current, post.type, isMuted, isTouchDevice]);

  // keep video muted state in sync when isMuted changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted, videoRef.current]);

  // toggle play/pause
  const togglePlay = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        try { e.stopPropagation(); } catch {}
        try { e.preventDefault(); } catch {}
      }
      const v = videoRef.current;
      if (!v || post.type !== 'video') return;
      if (v.paused) {
        try {
          await announcePlay(post.id, v);
          v.muted = isMuted;
          await v.play().catch(() => {});
          setIsPlaying(true);
          if (isTouchDevice) {
            if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = window.setTimeout(() => setHover(false), 2000);
          }
        } catch {
          setIsPlaying(false);
        }
      } else {
        v.pause();
        try {
          announcePause(post.id);
        } catch {}
        setIsPlaying(false);
        if (isTouchDevice) {
          // show controls when paused
          setHover(true);
          if (hideTimeoutRef.current) { window.clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
        }
      }
    },
    [post.id, announcePlay, announcePause, isMuted, isTouchDevice]
  );

  // seek by percent
  const seekToPct = useCallback((pct: number) => {
    const v = videoRef.current;
    if (!v || post.type !== 'video' || !v.duration || Number.isNaN(v.duration)) return;
    const clamped = Math.max(0, Math.min(100, pct));
    v.currentTime = (clamped / 100) * v.duration;
    setProgress(clamped);
  }, [post.type, videoRef.current]);

  // scrub handlers
  const onScrubStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isScrubbingRef.current = true;
  }, []);
  const onScrubEnd = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    isScrubbingRef.current = false;
    const pct = Number((e.target as HTMLInputElement).value);
    seekToPct(pct);
  }, [seekToPct]);
  const onScrubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const pct = Number(e.target.value);
    setProgress(pct);
  }, []);

  // open single feed viewer (standalone) -> save current open index for virtuoso restore
  // const openFeedViewerSingle = useCallback((e?: React.MouseEvent) => {
  //   e?.stopPropagation();
  //   try {
  //     if (typeof window !== 'undefined' && typeof index === 'number') {
  //       sessionStorage.setItem('memeverse_open_index', String(index));
  //     }
  //   } catch {}
  //   navigate(`/feed/${post.id}`, { state: { single: true, post } });
  // }, [navigate, post, index]);

  // also save pixel scroll as a fallback (memeverse_open_scroll)
  const openFeedViewerSingle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (typeof window !== 'undefined') {
        if (typeof index === 'number') {
          sessionStorage.setItem('memeverse_open_index', String(index));
        }
        // save pixel Y as fallback if index restore fails for any reason
        sessionStorage.setItem('memeverse_open_scroll', String(window.scrollY || 0));
      }
    } catch {}
    navigate(`/feed/${post.id}`, { state: { single: true, post } });
  }, [navigate, post, index]);

  // mute toggle
  const onMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  }, [toggleMute]);

  // fullscreen -> open player
  const onFullscreenClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openFeedViewerSingle(e);
  }, [openFeedViewerSingle]);

  // share
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

  // container click behavior (touch: reveal controls first; otherwise toggle)
  const onContainerClick = useCallback((e?: React.MouseEvent) => {
    if (isTouchDevice && post.type === 'video') {
      if (isPlaying && !hover) {
        setHover(true);
        return;
      }
    }
    togglePlay(e);
  }, [isTouchDevice, post.type, isPlaying, hover, togglePlay]);

  // helper: format times
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

  // download with CORS fallback
  const handleDownload = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(post.url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
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
      // fallback: open in new tab (CORS or other fetch failure)
      try {
        window.open(post.url, '_blank');
        toast.info('Opened media in a new tab (use browser download there).');
      } catch {
        toast.error('Download failed');
      }
    }
  }, [post.id, post.url, post.type]);

  return (
    <article
      className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md transition-all relative z-0"
      onMouseEnter={() => { if (!isTouchDevice) setHover(true); }}
      onMouseLeave={() => { if (!isTouchDevice) setHover(false); }}
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

        <div onClick={(e) => e.stopPropagation()}>
          <Menu>
            <MenuItem onClick={handleDownload} icon={<Download className="w-4 h-4" />}>Download</MenuItem>
            <MenuItem onClick={(e?: any) => { e?.stopPropagation(); onShareClick(e as any); }} icon={<Share2 className="w-4 h-4" />}>Share</MenuItem>
            <MenuItem onClick={() => toast('Reported (placeholder)')} icon={<svg width="14" height="14"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.2" /></svg>}>Report</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Media container */}
      <div
        ref={containerRef}
        className="w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer relative"
        style={{ height: 480 }}
        onClick={(e) => { onContainerClick(e); }}
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
              onClick={(e) => { e.stopPropagation(); onContainerClick(e); }}
              onTouchStart={() => { if (isTouchDevice) setHover(true); }}
            />
          )}

          {/* controls only for videos */}
           {post.type === 'video' && (
            <div
              className={`absolute inset-0 transition-opacity duration-150 z-10 ${hover ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              role="region"
              aria-hidden={!hover}
            >
              {/* center transparent clickable area */}

              <button
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(e);
                    }}
                    className="
                      absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                      w-28 h-28
                      rounded-full flex items-center justify-center
                      bg-black/60 backdrop-blur-sm
                      transition-all duration-150 hover:scale-105
                      pointer-events-auto
                    "
                    style={{ border: 'none' }}
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </button>

              {/* bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 h-16 px-3 pb-2 pointer-events-auto">
                <div className="absolute bottom-[44px] right-0 px-1 flex justify-end gap-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={isMuted ? 'Unmute' : 'Mute'} aria-pressed={isMuted} className="w-9 h-9 rounded-full  flex items-center justify-center">
                    {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                  </button>

                  <button type="button" onClick={(e) => { e.stopPropagation(); onFullscreenClick(e); }} aria-label="Open player" className="w-9 h-9 rounded-full flex items-center justify-center">
                    <Maximize2 className="w-7 h-7" />
                  </button>

                  <button type="button" onClick={(e) => { e.stopPropagation(); onShareClick(e); }} aria-label="Share" className="w-9 h-9 rounded-full flex items-center justify-center">
                    <Share2 className="w-7 h-7" />
                  </button>
                </div>

                <div className="flex items-center gap-3 h-full">
                  <button type="button" onClick={(e) => { e.stopPropagation(); togglePlay(e); }} aria-label={isPlaying ? 'Pause' : 'Play'} aria-pressed={isPlaying} className="w-9 h-9 rounded-full  flex items-center justify-center">
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                  </button>

                  <div className="flex-1 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progress}
                      onMouseDown={(e) => onScrubStart(e as any)}
                      onTouchStart={(e) => onScrubStart(e as any)}
                      onChange={(e) => onScrubChange(e as any)}
                      onMouseUp={(e) => onScrubEnd(e as any)}
                      onTouchEnd={(e) => onScrubEnd(e as any)}
                      aria-label="Seek"
                      className="thin-range w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="flex-shrink-0 text-m text-white/80 w-[90px] text-right font-bold" aria-live="polite">
                    <span>{formatTimeFromPct(progress)}</span>
                    <span className="mx-1">/</span>
                    <span>{totalDurationText()}</span>
                  </div>
                </div>
              </div>
            </div>
          )} 

        </div>
      </div>


          


      

      {/* caption + tags */}
      <div className="px-4 pb-4" style={{marginTop:"0.7 rem"}}>
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
        .thin-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          vertical-align: middle;
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
