// src/components/FeedPlayer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Play, Pause, Share2, Download, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TruncatedText } from './TruncatedText';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
        } else {
          v.pause();
          setIsPlaying(false);
        }
      } catch {}
    };
    startPlay();

    return () => {
      try {
        v.pause();
        announcePause(post.id);
      } catch {}
    };
  }, [isActive, post.id, announcePlay, announcePause, isMuted, videoRef, post.type]);

  // progress
  useEffect(() => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;
    const onTime = () => {
      if (!v.duration || Number.isNaN(v.duration)) {
        setProgress(0);
        return;
      }
      setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [videoRef, post.type]);

  // keyboard: space toggles play/pause when container focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // only when focus is inside container
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
  }, [containerRef, videoRef, post.id, announcePlay, announcePause]);

  // toggle UI hidden - also hide page scrollbars
  const toggleUiHidden = useCallback(() => {
    setUiHidden((prev) => {
      const next = !prev;
      try {
        document.body.style.overflow = next ? 'hidden' : '';
      } catch {}
      return next;
    });
  }, []);

  // single tap on video toggles UI (only for video)
  const onVideoTap = () => {
    if (post.type !== 'video') return;
    toggleUiHidden();
  };

  // fullscreen / landscape (standalone behaves as back)
  const handleLandscape = async () => {
    if (standalone) {
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
      const isFs = !!document.fullscreenElement;
      setIsLandscape(isFs);
    };
    window.addEventListener('fullscreenchange', onFsChange);
    return () => window.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // play/pause toggle (reused by keyboard handler)
  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;
    if (v.paused) {
      await announcePlay(post.id, v);
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      announcePause(post.id);
      setIsPlaying(false);
    }
  }, [videoRef, post.id, announcePlay, announcePause, post.type]);

  // download
  const handleDownload = async () => {
    try {
      const res = await fetch(post.url);
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
      toast.error('Download failed');
    }
  };

  // scrub
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || post.type !== 'video') return;
    const pct = Number(e.target.value);
    if (!v.duration || Number.isNaN(v.duration)) return;
    v.currentTime = (pct / 100) * v.duration;
    setProgress(pct);
  };

  // share
  const handleShare = async () => {
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
  };

  // helper: format combined time
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

  // helper: current time only (for left when needed)
  const getCurrentOnly = () => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return '0:00';
    const cur = Math.floor((progress / 100) * v.duration);
    const m = Math.floor(cur / 60);
    const s = Math.floor(cur % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center ${isLandscape ? 'feedplayer-landscape' : ''}`}
      onClick={() => {
        /* do nothing - controls handle propagation */
      }}
      tabIndex={0} // allow focus so space works
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
            onClick={(e) => {
              e.stopPropagation();
              onVideoTap();
            }}
          />
        )}

        {/* Controls overlay (visible unless uiHidden) */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${uiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          {/* Bottom area containing scrubber, time, and controls */}
          <div className="absolute left-0 right-0 bottom-0 px-3">
            {/* Scrubber row: play/pause at left, thin scrub, time at right */}
            <div className="flex items-center gap-3">
              {/* play/pause at left */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
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
                  onChange={(e) => {
                    e.stopPropagation();
                    handleScrub(e);
                  }}
                  aria-label="Seek"
                  className="thin-range w-full"
                />
              </div>

              {/* combined timer current / total */}
              <div className="flex-shrink-0 text-xs text-white/80 w-[110px] text-right">
                {getTimeText()}
              </div>
            </div>

            {/* Buttons row below scrubber: right: mute, fullscreen, share */}
            <div className="mt-2 flex items-center justify-end left-5 gap-2 pr-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLandscape();
                }}
                aria-label="Landscape / Fullscreen"
                className="w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                aria-label="Share"
                className="w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Optional caption area (hidden in standalone) */}
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
        .thin-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
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
        .feedplayer-landscape { transform: rotate(0deg); }
        .feedplayer-landscape .max-w-[900px] { width: 100vw; height: 100vh; }
      `}</style>
    </div>
  );
}
