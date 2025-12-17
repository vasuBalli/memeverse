// FeedCard.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, formatNumber} from '../data/mockData';
import { Download, Share2, Volume2, VolumeX, Maximize2, Play, Bookmark, Heart, MoreVertical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import {getDeviceId} from '../components/utils/deviceId'
import { usePostsActions, usePostsData } from '../contexts/PostsContext';



interface FeedCardProps {
  post: Post;
  allPosts?: Post[];
  postIndex?: number;
}

function FeedCardInner({ post, allPosts = [], postIndex = 0 }: FeedCardProps) {

  const caption = post.caption ?? '';

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);


  const [showMenu, setShowMenu] = useState(false);
  
//   const [isLiked, setIsLiked] = useState<boolean>(() => {
//   return Boolean((post as any).is_liked);
// });

const [likeCount, setLikeCount] = useState<number>(
  post.likes ?? 0
);

  const { interactions } = usePostsData();
  const { updateInteraction } = usePostsActions();

    const interaction = interactions[post.id] ?? {
    is_liked: false,
    is_bookmarked: false,
  };
  const isLiked = interaction.is_liked;
  const isBookmarked = interaction.is_bookmarked;





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
  // const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
  //   try {
  //     return !!localStorage.getItem(`bookmark:${post.id}`);
  //   } catch {
  //     return false;
  //   }
  // });

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);

  const CHAR_LIMIT = 15;
  // const shouldTruncate = post.caption.length > CHAR_LIMIT;
  const shouldTruncate = caption.length > CHAR_LIMIT;

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




  useEffect(() => {
  setLikeCount(post.likes ?? 0);
}, [post.id, post.likes]);


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


//   const handleLike = async () => {
//   const deviceId = getDeviceId();
//   const prevLiked = isLiked;

//   // ✅ Optimistic UI
//   setIsLiked(!prevLiked);
//   setLikeCount((c) => (prevLiked ? c - 1 : c + 1));

//   try {
//     await fetch('/api/like', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         meme_id: post.id,
//         device_id: deviceId,
//       }),
//     });
//   } catch (err) {
//     // ❌ Rollback if API fails
//     setIsLiked(prevLiked);
//     setLikeCount((c) => (prevLiked ? c + 1 : c - 1));
//   }
// };


// const handleLike = async () => {
//   const deviceId = getDeviceId();
//   const prevLiked = isLiked;
//   const prevCount = likeCount;

//   // ✅ Optimistic UI
//   setIsLiked(!prevLiked);
//   setLikeCount((c) => (prevLiked ? c - 1 : c + 1));

//   try {
//     const res = await fetch('/api/like/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         meme_id: post.id,
//         device_id: deviceId,
//       }),
//     });

//     if (!res.ok) {
//       throw new Error('Like API failed');
//     }

//     const data = await res.json();

//     // ✅ TRUST BACKEND (single source of truth)
//     setIsLiked(Boolean(data.liked));
//     setLikeCount(Number(data.likes_count));
//   } catch (err) {
//     console.error('Like failed', err);

//     // ❌ Rollback on failure
//     setIsLiked(prevLiked);
//     setLikeCount(prevCount);
//   }
// };


//       const handleLike = async () => {
//   const prevLiked = isLiked;
//   const prevCount = post.likes;
//   const deviceId = getDeviceId();

//   // ✅ Optimistic UI
//   setIsLiked(!prevLiked);
//   setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

//   try {
//     const res = await fetch('/api/like/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         meme_id: post.id, // ✅ ONLY meme_id
//         device_id: deviceId,
//       }),
//     });

//     if (!res.ok) {
//       throw new Error('Like API failed');
//     }

//     const data = await res.json();

//     // ✅ Backend is single source of truth
//     setIsLiked(Boolean(data.liked));
//     setLikeCount(Number(post.likes));
//   } catch (err) {
//     console.error('Like failed', err);

//     // ❌ Rollback on failure
//     setIsLiked(prevLiked);
//     setLikeCount(prevCount);
//   }
// };

// const handleLike = async () => {
//   const prevLiked = isLiked;
//   const prevCount = likeCount; // ✅ use state, not post.likes
//   const deviceId = getDeviceId();

//   // 🚀 1. Optimistic UI (instant)
//   setIsLiked(!prevLiked);
//   setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

//   try {
//     const res = await fetch('/api/like/', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         meme_id: post.id,
//         device_id: deviceId,
//       }),
//     });

//     if (!res.ok) throw new Error('Like API failed');

//     const data = await res.json();

//     // ✅ 2. Backend = final authority
//     setIsLiked(Boolean(data.liked));
//     setLikeCount(Number(data.likes_count));

//   } catch (err) {
//     console.error('Like failed', err);

//     // 🔙 3. Rollback only if API fails
//     setIsLiked(prevLiked);
//     setLikeCount(prevCount);
//   }
// };

//  const handleLike = async () => {
//     const deviceId = getDeviceId();
//     const prevLiked = isLiked;
//     const prevCount = likeCount;

//     updateInteraction(post.id, { is_liked: !prevLiked });
//     setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

//     try {
//       const res = await fetch('/api/like/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           meme_id: post.id,
//           device_id: deviceId,
//         }),
//       });

//       const data = await res.json();

//       updateInteraction(post.id, { is_liked: data.liked });
//       setLikeCount(data.likes_count);
//     } catch {
//       updateInteraction(post.id, { is_liked: prevLiked });
//       setLikeCount(prevCount);
//     }
//   };



//   const handleLike = async () => {
//   const deviceId = getDeviceId();
//   const prevLiked = isLiked;
//   const prevCount = likeCount;

//   // ✅ Optimistic update (UI + context)
//   updateInteraction(post.id, { is_liked: !prevLiked });
//   setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

//   try {
//     const res = await fetch('/api/like/', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         meme_id: post.id,
//         device_id: deviceId,
//       }),
//     });

//     if (!res.ok) throw new Error('Like failed');

//     const data = await res.json();

//     // ✅ Backend = source of truth
//     updateInteraction(post.id, { is_liked: Boolean(data.liked) });
//     setLikeCount(Number(data.likes_count));
//   } catch {
//     // ❌ Rollback
//     updateInteraction(post.id, { is_liked: prevLiked });
//     setLikeCount(prevCount);
//   }
// };

const handleLike = async () => {
  const deviceId = getDeviceId();
  const prevLiked = isLiked;
  const prevCount = likeCount;

  // optimistic
  updateInteraction(post.id, { is_liked: !prevLiked });
  setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

  try {
    const res = await fetch('/api/like/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meme_id: post.id,
        device_id: deviceId,
      }),
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    // ✅ BACKEND WINS
    updateInteraction(post.id, { is_liked: data.liked });
    setLikeCount(data.likes_count);
  } catch {
    updateInteraction(post.id, { is_liked: prevLiked });
    setLikeCount(prevCount);
  }
};



  /* ---------- BOOKMARK ---------- */
  // const handleBookmark = async (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const deviceId = getDeviceId();
  //   const prev = isBookmarked;

  //   updateInteraction(post.id, { is_bookmarked: !prev });

  //   try {
  //     const res = await fetch('/api/bookmark', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         meme_id: post.id,
  //         device_id: deviceId,
  //       }),
  //     });

  //     const data = await res.json();
  //     updateInteraction(post.id, { is_bookmarked: data.bookmarked });
  //   } catch {
  //     updateInteraction(post.id, { is_bookmarked: prev });
  //   }
  // };

  const handleBookmark = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const deviceId = getDeviceId();
  const prev = isBookmarked;

  updateInteraction(post.id, { is_bookmarked: !prev });

  try {
    const res = await fetch('/api/bookmark/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meme_id: post.id,
        device_id: deviceId,
      }),
    });

    const data = await res.json();
    updateInteraction(post.id, { is_bookmarked: data.bookmarked });
  } catch {
    updateInteraction(post.id, { is_bookmarked: prev });
  }
};







  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      // const url = `${window.location.origin}/feed/${post.id}`;
      // const url = `${window.location.origin}/api/post-details/?post_id=${post.id}`;

      const url = `${window.location.origin}/p?post_id=${post.id}`;

      try {
        if (navigator.share) {
          await navigator.share({ url, title: caption });
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
    [post.id, caption]
  );

  // const handleBookmark = useCallback(
  //   (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     try {
  //       const next = !isBookmarked;
  //       setIsBookmarked(next);
  //       if (next) {
  //         localStorage.setItem(`bookmark:${post.id}`, '1');
  //         toast.success('Added to bookmarks');
  //       } else {
  //         localStorage.removeItem(`bookmark:${post.id}`);
  //         toast.success('Removed from bookmarks');
  //       }
  //     } catch {
  //       setIsBookmarked((s) => !s);
  //       toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  //     }
  //   },
  //   [isBookmarked, post.id]
  // );
      // const handleBookmark = useCallback(
      //       async (e: React.MouseEvent) => {
      //         e.stopPropagation();

      //         const deviceId = getDeviceId();
      //         const prevBookmarked = isBookmarked;

      //         // ✅ Optimistic UI
      //         setIsBookmarked(!prevBookmarked);

      //         try {
      //           const res = await fetch('/api/bookmark', {
      //             method: 'POST',
      //             headers: {
      //               'Content-Type': 'application/json',
      //             },
      //             body: JSON.stringify({
      //               meme_id: post.id,
      //               device_id: deviceId,
      //             }),
      //           });

      //           if (!res.ok) throw new Error('Bookmark failed');

      //           const data = await res.json();

      //           // ✅ Backend is source of truth
      //           setIsBookmarked(Boolean(data.bookmarked));

      //           toast.success(
      //             data.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks'
      //           );
      //         } catch (err) {
      //           // ❌ Rollback on failure
      //           setIsBookmarked(prevBookmarked);
      //           toast.error('Failed to update bookmark');
      //         }
      //       },
      //       [isBookmarked, post.id]
      //     );

  return (
    <div ref={containerRef} className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md hover:border-white/10 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center">
          <span className="text-xs">{post.title.slice(-2)}</span>
        </div>
        <div>
          <p className="text-sm">{post.username}</p>
          <p className="text-xs text-[#6B6B7B]">{formatNumber(post.views)} views</p>
        </div>
        {/* Right Actions */}
  <div className="ml-auto flex absolute items-center right-0 gap-1">
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

      {/* Media */}
      {post.type === 'image' ? (
        post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} alt={caption} />
        ) : (
          <div className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden">
            <ImageWithFallback
              src={post.thumbnail || post.url}
              alt={caption}
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
        <div className="flex items-center justify-between px-4 pb-2">
          {/* Left: Like */}
          <button
                onClick={handleLike}
                className={`flex items-center gap-2 p-2 text-sm transition-colors ${
                  isLiked
                    ? 'text-pink-500'
                    : 'text-[#6B6B7B] hover:text-pink-400'
                }`}
              >
                <Heart
                  className="w-5 h-5 transition-all duration-150"
                  fill={isLiked ? '#ec4899' : 'none'}
                  stroke={isLiked ? '#ec4899' : 'currentColor'}
                />

                  <span className="text-xs font-medium">
                    {formatNumber(likeCount)}
                  </span>
                </button>



            {/* Right: Other actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmark}
                className={`p-2 transition-colors ${
                  isBookmarked
                    ? 'text-[#00A8FF]'
                    : 'text-[#6B6B7B] hover:text-[#00A8FF]'
                }`}
                title="Bookmark"
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isBookmarked ? 'fill-[#00A8FF]' : ''
                  }`}
                />
              </button>

                <button
                  onClick={handleShare}
                  className="p-2 text-[#6B6B7B] hover:text-[#6C5CE7] transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

      

      {/* Caption & Tags */}
      <div className="px-4 py-3">
        <div className="text-sm text-gray-200">
          {shouldTruncate && !showFullCaption ? (
            <div className="relative">
              <div className="overflow-hidden line-clamp-2">
                <span className="leading-relaxed">{caption}</span>
              </div>
              <button onClick={() => setShowFullCaption(true)} className="text-[#6B6B7B] hover:text-[#6C5CE7] text-xs mt-1 font-medium">
                See more
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 leading-relaxed">{caption}</div>
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
