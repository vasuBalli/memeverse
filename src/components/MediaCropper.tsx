"use client"
import { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface MediaCropperProps {
  file: File;
  aspectRatio: number; // width / height
  onConfirm: (cropData: CropData) => void;
  onCancel: () => void;
}

export interface CropData {
  file: File;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  scale: number; // 1-3
}

export function MediaCropper({ file, aspectRatio, onConfirm, onCancel }: MediaCropperProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaUrl = useRef<string | null>(null);

  // Initialize and cleanup URL
  useEffect(() => {
    mediaUrl.current = URL.createObjectURL(file);
    return () => {
      if (mediaUrl.current) URL.revokeObjectURL(mediaUrl.current);
    };
  }, [file]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Convert pixel delta to percentage delta
    // This is approximate, but works for visual positioning
    const sensitivity = 0.2;
    setPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x - dx * sensitivity)),
      y: Math.max(0, Math.min(100, prev.y - dy * sensitivity))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    onConfirm({
      file,
      x: position.x,
      y: position.y,
      scale
    });
  };

  const isVideo = file.type.startsWith('video/');

  // Avoid rendering if URL isn't ready
  if (!mediaUrl.current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Adjust Media</h3>
        <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Cropping Area */}
      <div 
        className="relative w-full max-w-md bg-[#15151F] overflow-hidden rounded-xl border border-white/10"
        style={{ aspectRatio: aspectRatio }}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
           <div className="border border-white/30 w-full h-full pointer-events-none" />
           <Move className="w-8 h-8 text-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
        </div>

        <div 
          className="w-full h-full relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {isVideo ? (
             <video 
               src={mediaUrl.current} 
               className="w-full h-full object-cover pointer-events-none"
               style={{ objectPosition: `${position.x}% ${position.y}%` }}
               autoPlay 
               loop 
               muted 
             />
          ) : (
             <Image
               src={mediaUrl.current} 
               alt="Crop preview" 
               className="w-full h-full object-cover pointer-events-none select-none"
               style={{ objectPosition: `${position.x}% ${position.y}%` }}
               draggable={false}
             />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <ZoomOut className="w-5 h-5 text-gray-400" />
          <input 
            type="range" 
            min="1" 
            max="3" 
            step="0.1" 
            value={scale} 
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-[#6C5CE7] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <ZoomIn className="w-5 h-5 text-gray-400" />
        </div>

        <p className="text-center text-xs text-gray-400">
          Drag to reposition • Use slider to zoom
        </p>

        <button 
          onClick={handleConfirm}
          className="w-full py-4 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4ec2] text-white font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Confirm Crop
        </button>
      </div>
    </div>
  );
}
