// src/components/FeedPlayer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Play, Pause, Share2, Download, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TruncatedText } from './TruncatedText';
import { useNavigate } from 'react-router-dom';

interface FeedPlayerProps {
  post: Post;
  isActive: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  standalone?: boolean;
}

export function FeedPlayer({
  post,
  isActive,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  standalone = false,
}: FeedPlayerProps) {
  const { videoRef, shouldLoad } = useLazyVideo();
  const { announcePlay, announcePause, isMuted, toggleMute } = useVideoSound();

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const hideTimeoutRef = useRef<number | null>(null);
  const isScrubbingRef = useRef(false);
  const lastTimeUpdateRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (window.matchMedia && window.matchMedia('(hover: none)').matches));

  // autoplay/pause when active
  useEffect(() => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;

    const startPlay = async () => {
      try {
        await announcePlay(post.id, v);
        v.muted = isMuted;
        if (isActive) {
          setIsPlaying(true);
          await v.play().catch(() => {});
          // hide controls automatically on touch
          if (isTouchDevice) {
            if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = window.setTimeout(() => setUiHidden(true), 2000);
          }
        } else {
          v.pause();
          setIsPlaying(false);
        }
      } catch {}
    };
    startPlay();

    return () => {
      try { v.pause(); announcePause(post.id); } catch {}
      if (hideTimeoutRef.current) { window.clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    };
  }, [isActive, post.id, announcePlay, announcePause, isMuted, videoRef.current, post.type, isTouchDevice]);

  // Attach timeupdate with throttling
  useEffect(() => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;

    const onTime = () => {
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
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [videoRef.current, post.type]);

  // keyboard: space toggles play/pause when container focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!containerRef.current) return;
        const active = document.activeElement;
        if (!containerRef.current.contains(active)) return;
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, videoRef.current, post.id]);

  // toggle UI hidden - also hide page scrollbars
  const toggleUiHidden = useCallback(() => {
    setUiHidden((prev) => {
      const next = !prev;
      try { document.body.style.overflow = next ? 'hidden' : ''; } catch {}
      return next;
    });
  }, []);

  // show controls temporarily on touch
  const showControlsTemporarily = useCallback(() => {
    if (!isTouchDevice) return;
    setUiHidden(false);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => setUiHidden(true), 2000);
  }, [isTouchDevice]);

  // fullscreen / landscape (standalone behaves as back)
  const handleLandscape = async () => {
    if (standalone) {
      // navigate back — FeedCard saved index before opening
      navigate(-1);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await (el as any).requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      setIsLandscape((s) => !s);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsLandscape(!!document.fullscreenElement);
    };
    window.addEventListener('fullscreenchange', onFsChange);
    return () => window.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // toggle play/pause via controls (no single-click on video per requirement)
  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;
    if (v.paused) {
      await announcePlay(post.id, v);
      v.play().catch(() => {});
      setIsPlaying(true);
      if (isTouchDevice) {
        if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = window.setTimeout(() => setUiHidden(true), 2000);
      }
    } else {
      v.pause();
      announcePause(post.id);
      setIsPlaying(false);
      if (isTouchDevice) {
        setUiHidden(false);
        if (hideTimeoutRef.current) { window.clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
      }
    }
  }, [videoRef.current, post.id, announcePlay, announcePause, post.type, isTouchDevice]);

  // download with fallback
  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(post.url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memeverse-${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1500);
      toast.success('Download started!');
    } catch {
      try {
        window.open(post.url, '_blank');
        toast.info('Opened media in a new tab (use browser download there).');
      } catch {
        toast.error('Download failed');
      }
    }
  }, [post.id, post.url, post.type]);

  // scrub handlers
  const handleScrubStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    isScrubbingRef.current = true;
  };
  const handleScrubEnd = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    isScrubbingRef.current = false;
    const pct = Number((e.target as HTMLInputElement).value);
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    v.currentTime = (pct / 100) * v.duration;
    setProgress(pct);
  };
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const pct = Number(e.target.value);
    setProgress(pct);
  };

  // share
  const handleShare = useCallback(async () => {
    const url = window.location.href;
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
        toast.success('Link copied!');
      }
    } catch {
      toast.error('Share failed');
    }
  }, []);

  const getTimeText = () => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return '0:00 / 0:00';
    const cur = Math.floor((progress / 100) * v.duration);
    const total = Math.floor(v.duration);
    const fmt = (t: number) => {
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    return `${fmt(cur)} / ${fmt(total)}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center ${isLandscape ? 'feedplayer-landscape' : ''}`}
      tabIndex={0}
      onClick={() => { if (isTouchDevice) showControlsTemporarily(); }}
    >
      <div className="relative w-full h-full max-w-[900px] mx-auto">
        {post.type === 'image' ? (
          <ImageWithFallback src={post.url} alt={post.caption} className="w-full h-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            src={shouldLoad ? post.url : undefined}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            muted={isMuted}
            // intentionally no onClick toggling
          />
        )}

        {/* Controls overlay (match FeedCard behavior/layout) */}
        {post.type === 'video' && (
          <div className={`absolute inset-0 transition-opacity duration-200 ${uiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`} aria-hidden={uiHidden}>
            {/* center transparent area */}
            <button aria-label={isPlaying ? 'Pause' : 'Play'} onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'transparent', border: 'none' }} />

            <div className="absolute left-0 right-0 bottom-0 px-3">
              <div className="mt-2 flex items-center justify-end left-5 gap-2 pr-1">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={isMuted ? 'Unmute' : 'Mute'} className="w-9 h-9 rounded-full glass flex items-center justify-center">
                  {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                </button>
                

                <button onClick={(e) => { e.stopPropagation(); handleLandscape(); }} aria-label="Landscape / Fullscreen" className="w-9 h-9 rounded-full glass flex items-center justify-center">
                  <Maximize2 className="w-7 h-7" />
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleShare(); }} aria-label="Share" className="w-9 h-9 rounded-full glass flex items-center justify-center">
                  <Share2 className="w-7 h-7" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} aria-label={isPlaying ? 'Pause' : 'Play'} className="w-9 h-9 rounded-full glass flex items-center justify-center">
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                  </button>
                </div>

                <div className="flex-1">
                  <input type="range" min={0} max={100} value={progress} onMouseDown={(e) => handleScrubStart(e)} onTouchStart={(e) => handleScrubStart(e as any)} onChange={(e) => handleScrub(e)} onMouseUp={(e) => handleScrubEnd(e as any)} onTouchEnd={(e) => handleScrubEnd(e as any)} aria-label="Seek" className="thin-range w-full" onClick={(e) => e.stopPropagation()} />
                </div>

                <div className="flex-shrink-0 text-xs text-white/80 w-[110px] text-right">
                  {getTimeText()}
                </div>
              </div>

              
            </div>
          </div>
        )}

        {!standalone && (
          <div className="absolute bottom-24 left-6 right-6 pointer-events-none">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center text-xs">
                  {post.deviceId.slice(-2)}
                </div>
                <div>
                  <div className="text-sm text-white">Device {post.deviceId}</div>
                  <div className="text-xs text-white/60">{formatNumber(post.views)} views</div>
                </div>
              </div>

              <div className="text-sm text-white/90">
                <TruncatedText text={post.caption} lines={2} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .thin-range { -webkit-appearance: none; appearance: none; height: 4px; background: rgba(255,255,255,0.12); border-radius: 999px; vertical-align: middle; }
        .thin-range::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #6C5CE7; box-shadow: 0 0 0 6px rgba(108,92,231,0.12); }
        .thin-range::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #6C5CE7; }
        .feedplayer-landscape { transform: rotate(0deg); }
        .feedplayer-landscape .max-w-[900px] { width: 100vw; height: 100vh; }
      `}</style>
    </div>
  );
}
