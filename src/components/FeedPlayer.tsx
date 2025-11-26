// src/components/FeedPlayer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Play, Pause, Share2, Download, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLazyVideo } from '../hooks/useLazyVideo';
import { useVideoSound } from '../contexts/VideoSoundContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TruncatedText } from './TruncatedText';

interface FeedPlayerProps {
  post: Post;
  isActive: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function FeedPlayer({ post, isActive, onNext, onPrevious, hasNext, hasPrevious }: FeedPlayerProps) {
  const { videoRef, shouldLoad } = useLazyVideo();
  const { announcePlay, announcePause, isMuted, toggleMute, setMuted } = useVideoSound();

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // keep a ref for fullscreen fallback
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // fullscreen / landscape
  const handleLandscape = async () => {
    const el = containerRef.current;
    if (!el) return;
    // Prefer Fullscreen API
    try {
      if (!document.fullscreenElement) {
        // request fullscreen on container for immersive landscape
        // but try element.requestFullscreen with orientation hint if available
        await (el as any).requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // fallback to css class
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

  // play/pause toggle
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
      window.URL.revokeObjectURL(url);
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

  // keyboard Esc to unhide UI
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uiHidden) {
        setUiHidden(false);
        try {
          document.body.style.overflow = '';
        } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [uiHidden]);

  // ensure cleanup of body overflow on unmount
  useEffect(() => {
    return () => {
      try {
        document.body.style.overflow = '';
      } catch {}
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center ${isLandscape ? 'feedplayer-landscape' : ''}`}
      onClick={() => {
        /* don't toggle UI when clicking on control elements; controls stopPropagation themselves */
      }}
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

        {/* Controls — hidden when uiHidden === true */}
        <div
          className={`absolute bottom-4 left-4 right-4 transition-opacity duration-200 ${uiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          {/* Top-right button cluster placed above the scrubber end */}
          <div className="flex justify-end mb-2 pr-1 w-full ">
            <div className="flex gap-2 items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                aria-label="Download"
                className="w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                <Download className="w-4 h-4" />
              </button>

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
            </div>
          </div>

          {/* main control row: play + scrub + share */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <div className="flex-1 px-3">
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
                className="w-full"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }}
              aria-label="Share"
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* bottom row: caption + small device + download/mute text buttons */}
          <div className="flex items-start justify-between mt-3 gap-4 px-1">
            <div className="flex-1">
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
        </div>
      </div>

      <style>{`
        /* hide visual chrome in uiHidden mode */
        .feedplayer-landscape { transform: rotate(0deg); }
        /* optionally enlarge when css-only landscape fallback */
        .feedplayer-landscape .max-w-[900px] { width: 100vw; height: 100vh; }
      `}</style>
    </div>
  );
}
