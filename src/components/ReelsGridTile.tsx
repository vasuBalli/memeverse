import { useState } from 'react';
import { Post, formatNumber } from '../data/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Eye } from 'lucide-react';

interface ReelsGridTileProps {
  post: Post;
  onClick: () => void;
}

export function ReelsGridTile({ post, onClick }: ReelsGridTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate aspect ratio class based on video aspect ratio
  const getAspectRatioClass = () => {
    if (!post.aspectRatio) return 'aspect-[9/16]'; // Default vertical
    
    if (post.aspectRatio < 0.75) {
      return 'aspect-[9/16]'; // Vertical/Portrait
    } else if (post.aspectRatio > 1.5) {
      return 'aspect-[16/9]'; // Horizontal/Landscape  
    } else {
      return 'aspect-square'; // Square
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${getAspectRatioClass()}`}
    >
      {/* Video Thumbnail */}
      {post.type === 'video' ? (
        <video
          src={post.file_url}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            video.currentTime = 0.1; // Show first frame
          }}
        />
      ) : (
        <ImageWithFallback
          src={post.file_url}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Stats overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm mb-2 line-clamp-2">{post.title}</p>
        <div className="flex items-center gap-3 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatNumber(post.views)}</span>
          </div>
        </div>
      </div>

      {/* Neon border effect on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-[#6C5CE7]/0 group-hover:border-[#6C5CE7]/50 transition-all duration-300 pointer-events-none" />
    </div>
  );
}