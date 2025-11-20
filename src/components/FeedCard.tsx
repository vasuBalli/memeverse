import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, formatNumber } from '../data/mockData';
import { Download, Share2, Volume2, VolumeX } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageCarousel } from './ImageCarousel';
import { toast } from 'sonner@2.0.3';

interface FeedCardProps {
  post: Post;
  allPosts?: Post[];
  postIndex?: number;
}

export function FeedCard({ post, allPosts = [], postIndex = 0 }: FeedCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play video when in viewport
  useEffect(() => {
    if (post.type !== 'video' || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef.current);

    return () => observer.disconnect();
  }, [post.type]);

  const handleMediaClick = () => {
    // Only navigate to reels viewer for videos
    if (post.type === 'video') {
      navigate(`/reels/${post.id}`, { 
        state: { 
          posts: allPosts.length > 0 ? allPosts : [post], 
          initialIndex: postIndex 
        } 
      });
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reels/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 shadow-md hover:border-white/10 transition-all">
      {/* Device ID Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center">
          <span className="text-xs">{post.deviceId.slice(-2)}</span>
        </div>
        <div>
          <p className="text-sm">Device {post.deviceId}</p>
          <p className="text-xs text-[#6B6B7B]">{formatNumber(post.views)} views</p>
        </div>
      </div>

      {/* Media - Clickable for videos only */}
      {post.type === 'image' ? (
        // Use carousel if multiple images, otherwise single image
        post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} alt={post.caption} />
        ) : (
          <div className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden">
            <ImageWithFallback
              src={post.url}
              alt={post.caption}
              className="w-full h-full object-cover"
            />
          </div>
        )
      ) : (
        <div 
          className="relative aspect-[4/5] bg-[#0A0A0F] overflow-hidden cursor-pointer group"
          onClick={handleMediaClick}
        >
          <video
            ref={videoRef}
            src={post.url}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
          />
          
          {/* Mute/Unmute button for videos */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMuteToggle();
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 group"
        >
          <Download className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#00A8FF] transition-colors" />
          <span className="text-sm text-[#A0A0B0]">Download</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 group ml-auto"
        >
          <Share2 className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#6C5CE7] transition-colors" />
          <span className="text-sm text-[#A0A0B0]">Share</span>
        </button>
      </div>

      {/* Caption & Tags */}
      <div className="px-4 py-3">
        <p className="text-sm mb-2">{post.caption}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag,index) => (
            <span
              key={`${tag}-${index}`}
              className="px-3 py-1 rounded-full bg-[#1E1E2E] text-xs text-[#00A8FF] border border-[#00A8FF]/20"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}