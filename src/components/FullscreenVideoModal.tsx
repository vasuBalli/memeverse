import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Share2, LogOut, Download } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  initialTime?: number;
  autoPlay?: boolean;
}

export function FullscreenVideoModal({ 
  isOpen, 
  onClose, 
  videoUrl, 
  initialTime = 0,
  autoPlay = true 
}: FullscreenVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = initialTime;
      if (autoPlay) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => setIsPlaying(false));
        }
      }
    }
  }, [isOpen, initialTime, autoPlay]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memeverse-video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed. Please try again.');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={() => handlePlayPause()}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Click on video toggles play */}
        <div 
          className="absolute inset-0" 
          onClick={(e) => handlePlayPause(e)}
        ></div>

        {/* Close Button - Changed to Exit Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <LogOut className="w-6 h-6 rotate-180" />
        </button>

        {/* Big Play Button (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
             <div className="w-20 h-20 rounded-full bg-[#00A8FF]/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
             </div>
          </div>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <div className="mb-4 group">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:w-3 [&_[data-slot=slider-thumb]]:h-3 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:ring-0"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button 
                    onClick={handlePlayPause}
                    className="text-white hover:text-[#00A8FF] transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" fill="currentColor" />
                    ) : (
                      <Play className="w-8 h-8" fill="currentColor" />
                    )}
                  </button>

                  {/* Time */}
                  <span className="text-sm text-white/90 font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Side Controls: Mute, Download, Share together */}
                <div className="flex items-center gap-4">
                   {/* Volume */}
                   <button 
                    onClick={handleMuteToggle}
                    className="text-white hover:text-[#00A8FF] transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </button>

                   {/* Download */}
                   <button
                    onClick={handleDownload}
                    className="text-white hover:text-[#00A8FF] transition-colors"
                    title="Download"
                  >
                    <Download className="w-6 h-6" />
                  </button>

                   {/* Share */}
                   <button 
                    onClick={handleShare}
                    className="text-white hover:text-[#00A8FF] transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
