"use client"
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Volume2, VolumeX, Maximize2, Play, Pause, Bookmark, Heart, MoreVertical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { useStore } from '../context/StoreContext';


interface FeedCardProps {
  post: Post;
  allPosts?: Post[];
  postIndex?: number;
  onOpenFullscreen?: (post: Post, time: number) => void;
  context?: 'feed' | 'single';
}

export function FeedCard({ post, allPosts = [], postIndex = 0,context = 'feed',onOpenFullscreen}: FeedCardProps) {
  const router = useRouter();
  const { toggleLike, toggleBookmark, isLiked, isBookmarked } = useStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showControls, setShowControls] = useState(false);
  // const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

   const [showMenu, setShowMenu] = useState(false);

  

  
  // Check state from store
  const liked = isLiked(post.id);
  const bookmarked = isBookmarked(post.id);

  // Interaction timer for auto-hiding controls
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // const CHAR_LIMIT = 300;
  // const shouldTruncate = post.title.length > CHAR_LIMIT;
  // const hasTags = post.tags && post.tags.length > 0;


   const CHAR_LIMIT = 15;
  // const shouldTruncate = post.caption.length > CHAR_LIMIT;
  const shouldTruncate = post.title.length > CHAR_LIMIT;

  const hasTags = !!(post.tags && post.tags.length);


  // Handle video visibility - Pause when out of view
  useEffect(() => {
     if (context === 'single') return;
    if (post.type !== 'video' || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef.current);

    return () => observer.disconnect();
  }, [post.type,context]);

  // Auto-hide controls after 3 seconds of inactivity when playing
  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls]);

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
    // Reset auto-hide timer on interaction
    setShowControls(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.type === 'video') {
      // Pause inline video
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        onOpenFullscreen?.(
          post,
          videoRef.current?.currentTime || 0
        );
      }
      // setIsFullscreenOpen(true);
      }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setShowControls(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true); // Keep controls visible when paused
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(post.file_url);
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

  // const handleShare = async (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const url = `${window.location.origin}/reels/${post.id}`;
    
  //   const shareData = {
  //     title: 'MemeVerse',
  //     text: post.title,
  //     url: url,
  //   };

  //   if (navigator.share) {
  //     try {
  //       await navigator.share(shareData);
  //     } catch (err) {
  //       // User cancelled or failed silently
  //     }
  //   } else {
  //     navigator.clipboard.writeText(url);
  //     toast.success('Link copied to clipboard!');
  //   }
  // };
  // const handleShare = useCallback(
  //   async (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     // const url = `${window.location.origin}/feed/${post.id}`;
  //     // const url = `${window.location.origin}/api/post-details/?post_id=${post.id}`;

  //     // const url = `${window.location.origin}/p?post_id=${post.id}`;
  //     const url = `${window.location.origin}/post/${post.id}`;


  //     try {
  //       if (navigator.share) {
  //         await navigator.share({ url, title: post.title });
  //         toast.success('Shared!');
  //       } else if (navigator.clipboard && navigator.clipboard.writeText) {
  //         await navigator.clipboard.writeText(url);
  //         toast.success('Link copied to clipboard!');
  //       } else {
  //         const temp = document.createElement('textarea');
  //         temp.value = url;
  //         document.body.appendChild(temp);
  //         temp.select();
  //         document.execCommand('copy');
  //         temp.remove();
  //         toast.success('Link copied to clipboard!');
  //       }
  //     } catch {
  //       toast.error('Unable to share. Try copying the link manually.');
  //     }
  //   },
  //   [post.id, post.title]
  // );
//   const handleShare = async (e: React.MouseEvent) => {
//   e.stopPropagation();

//   // const url = `${window.location.origin}/post/${post.id}`;
//   const url = `${window.location.origin}/api/post-details?post_id=${post.id}`;


//   try {
//     // 1️⃣ Native share (mobile)
//     if (navigator.share) {
//       await navigator.share({
//         title: post.title ?? 'MemeVerse',
//         text: post.title ?? '',
//         url,
//       });
//       toast.success('Shared!');
//       return;
//     }

//     // 2️⃣ Clipboard API (modern browsers)
//     if (navigator.clipboard?.writeText) {
//       await navigator.clipboard.writeText(url);
//       toast.success('Link copied to clipboard!');
//       return;
//     }

//     // 3️⃣ Fallback (old browsers)
//     const temp = document.createElement('textarea');
//     temp.value = url;
//     document.body.appendChild(temp);
//     temp.select();
//     document.execCommand('copy');
//     temp.remove();
//     toast.success('Link copied to clipboard!');
//   } catch (err) {
//     console.error(err);
//     toast.error('Unable to share. Please copy link manually.');
//   }
// };

const handleShare = useCallback(
  async (e: React.MouseEvent) => {
    e.stopPropagation();

    const url = `${window.location.origin}/post?post_id=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          url,
          title: post.title,
        });
        toast.success('Shared!');
      } else if (navigator.clipboard?.writeText) {
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
  [post.id, post.title]
);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(post.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(post.id);
    toast.success(bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
    // Reset auto-hide timer on interaction
    setShowControls(true);
  };

  const handleControlsInteraction = () => {
    setShowControls(true);
  };

  return (
    <div className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md hover:border-white/10 transition-all">
      {/* Device ID Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center">
          {/* <span className="text-xs">{post.deviceId}</span> */}
        </div>
        <div>
          <p className="text-sm">Device {post.deviceId}</p>
          {/* <p className="text-xs text-[#6B6B7B]">{formatNumber(post.views)} views</p> */}
          {context === 'feed' && (
  <p className="text-xs text-[#6B6B7B]">
    {formatNumber(post.views)} views
  </p>
)}

        </div>
           {/* Right Actions */}
  {/* <div className="ml-auto flex absolute items-center right-0 gap-1"> */}
    <div className="ml-auto flex items-center gap-1">

    {/* Download */}
    <button
      onClick={handleDownload}
      className="p-2 rounded-full text-[#6B6B7B] hover:text-[#00A8FF] hover:bg-white/5 transition"
      title="Download"
    >
      <Download className="w-5 h-5" />
    </button>

    {/* More Menu */}
    <div className="relative">
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="p-2 rounded-full text-[#6B6B7B] hover:text-white hover:bg-white/5 transition"
        title="More"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[#1E1E2E] border border-white/10 shadow-xl overflow-hidden z-50">
          <button
            // onClick={handleHide}
            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition"
          >
            Hide
          </button>

          <button
            // onClick={handleReport}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            Report
          </button>
        </div>
      )}
    </div>
  </div>
      </div>

      {/* Media - Clickable for videos only */}
      {post.type === 'image' ? (
        // Use carousel if multiple images, otherwise single image
        post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} alt={post.title} />
        ) : (
          <div className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden">
            <ImageWithFallback
              src={post.file_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )
      ) : (
        <div 
          className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden cursor-pointer group"
          onClick={(e) => togglePlay(e)}
          onMouseEnter={() => setShowControls(true)}
          onMouseMove={handleControlsInteraction}
          onMouseLeave={() => !isPlaying && setShowControls(false)}
        >
          <video
            preload='metadata'
            poster={post.thumbnail}
            ref={videoRef}
            src={post.file_url}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
          
          {/* Center Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)] scale-100 hover:scale-110 transition-transform border border-white/20 backdrop-blur-sm group-hover:scale-105">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
              
              {/* Time Duration Preview (Always visible when paused) */}
               <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium backdrop-blur-sm border border-white/10">
                {formatTime(duration || 0)}
              </div>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end transition-opacity duration-500 ${isPlaying && showControls ? 'opacity-100' : isPlaying && !showControls ? 'opacity-0' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()} 
          >
             <div className="p-4 w-full space-y-2 pointer-events-auto">
                {/* Progress Bar */}
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
                    {/* Mute/Unmute button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle();
                      }}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-md border border-white/10"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Time Display */}
                    <div className="text-xs text-white/90 font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  {/* Fullscreen/Expand button */}
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

      {/* Actions Row - for ALL posts including video (now moved out of video controls) */}
      <div className="flex items-center justify-end gap-3 px-4 pb-2">
         <button 
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors p-2 ${liked ? 'text-red-500' : 'text-[#6B6B7B] hover:text-red-500'}`}
          title="Like"
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
        </button>
         <button 
          onClick={handleBookmark}
          className={`flex items-center gap-2 text-sm transition-colors p-2 ${bookmarked ? 'text-[#00A8FF]' : 'text-[#6B6B7B] hover:text-[#00A8FF]'}`}
          title="Bookmark"
        >
          <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-[#00A8FF]' : ''}`} />
        </button>
         <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-sm text-[#6B6B7B] hover:text-[#6C5CE7] transition-colors p-2"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
       
      </div>

     

      {/* Caption & Tags */}
      <div className="px-4 py-3">
        <div className="text-sm text-gray-200">
          {shouldTruncate && !showFullCaption ? (
            <div className="relative">
              <div className="overflow-hidden line-clamp-2">
                <span className="leading-relaxed">{post.title}</span>
              </div>
              <button onClick={() => setShowFullCaption(true)} className="text-[#6B6B7B] hover:text-[#6C5CE7] text-xs mt-1 font-medium">
                See more
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 leading-relaxed">{post.title}</div>
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

     
    </div>
  );
}
