import { useState, useRef, useEffect } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface ReelPlayerProps {
  post: Post;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function ReelPlayer({ post, isActive }: ReelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 500);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(post.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memeverse-${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed. Please try again.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video */}
      <div
        onClick={handleVideoClick}
        className="relative w-full h-full max-w-[600px] mx-auto cursor-pointer"
      >
        {post.type === 'video' ? (
          <video
            ref={videoRef}
            src={post.url}
            className="w-full h-full object-contain"
            loop
            playsInline
            muted={isMuted}
            autoPlay={isActive}
          />
        ) : (
          <ImageWithFallback
            src={post.url}
            alt={post.caption}
            className="w-full h-full object-contain"
          />
        )}

        {/* Play/Pause overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-white" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Progress bar */}
      {post.type === 'video' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6C5CE7] via-[#00A8FF] to-[#FF3B6A]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Right sidebar actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6">
        {/* Download */}
        <button onClick={handleDownload} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
            <Download className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs text-white">Save</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs text-white">Share</span>
        </button>

        {/* Mute/Unmute */}
        {post.type === 'video' && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
              {isMuted ? (
                <VolumeX className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Volume2 className="w-7 h-7 text-[#00A8FF] group-hover:scale-110 transition-transform" />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Bottom caption area */}
      <div className="absolute bottom-4 left-4 right-24 space-y-2">
        {/* Device ID */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center">
            <span className="text-sm">{post.deviceId.slice(-2)}</span>
          </div>
          <div>
            <p className="text-sm text-white">Device {post.deviceId}</p>
            <p className="text-xs text-white/60">{formatNumber(post.views)} views</p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-white leading-relaxed line-clamp-3">{post.caption}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-[#00A8FF]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}