"use client"
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Pause, Play, Download, Share2, Heart, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Slider } from './ui/slider';
import { formatNumber } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { toast } from 'sonner';

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  initialTime?: number;
  autoPlay?: boolean;
}

export function FullscreenVideoModal({ isOpen, onClose, videoUrl, initialTime = 0, autoPlay = true }: FullscreenVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = initialTime;
      if (autoPlay) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [isOpen, initialTime, autoPlay]);

  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);

useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (isOpen) {
    window.addEventListener('keydown', handleKey);
  }

  return () => {
    window.removeEventListener('keydown', handleKey);
  };
}, [isOpen, onClose]);


  // useEffect(() => {
  //   if (isPlaying && showControls) {
  //     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  //     controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  //   }
  //   return () => {
  //     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  //   };
  // }, [isPlaying, showControls]);

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

  if (isOpen) {
    window.addEventListener('mousemove', handleMouseMove);
  }

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };
}, [isOpen, isPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };



  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
    setShowControls(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          {/* <div className="relative w-full h-full max-w-lg mx-auto bg-black flex flex-col justify-center"> */}
            <div className="relative w-full h-full bg-black flex flex-col justify-center">

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
            >
              <LogOut className="w-6 h-6 rotate-180" />
            </button>

            {/* Video Player */}
            <div 
              // className="relative w-full aspect-[9/16] bg-black"
               className="relative w-full h-full bg-black"

              onClick={togglePlay}
              
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
               
                loop
                playsInline
                muted={isMuted}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Center Play Button */}
              {/* {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </button>
                </div>
              )} */}
              {!isPlaying && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
      <Play className="w-8 h-8 text-white ml-1" fill="white" />
    </div>
  </div>
)}


              {/* Controls Overlay */}
              <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col gap-4">
                  {/* Seek Bar */}
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-white/80 w-10 text-right">{formatTime(currentTime)}</span>
                     <Slider
                       value={[currentTime]}
                       max={duration || 100}
                       step={0.1}
                       onValueChange={handleSeek}
                       className="flex-1 cursor-pointer"
                     />
                     <span className="text-xs text-white/80 w-10">{formatTime(duration)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePlay}>
                        {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                      </button>
                      <button onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <button className="text-white hover:text-[#6C5CE7]" onClick={() => toast.success('Liked!')}>
                         <Heart className="w-6 h-6" />
                      </button>
                      <button className="text-white hover:text-[#00A8FF]" onClick={() => toast.success('Shared!')}>
                         <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
