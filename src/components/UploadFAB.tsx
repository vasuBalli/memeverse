"use client"
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Video, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function UploadFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success('File selected! Uploading to MemeVerse...');
      // Simulate upload
      setTimeout(() => {
        toast.success('Upload complete! Your meme is now live.');
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-16 right-0 mb-4 flex flex-col gap-3 items-end"
            >
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#15151F] border border-white/10 text-white shadow-lg hover:bg-[#1E1E2E] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-sm font-medium">Upload Media</span>
                <ImageIcon className="w-4 h-4 text-[#6C5CE7]" />
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#15151F] border border-white/10 text-white shadow-lg hover:bg-[#1E1E2E] transition-colors"
                onClick={() => toast.info('Camera feature coming soon!')}
              >
                <span className="text-sm font-medium">Record</span>
                <Video className="w-4 h-4 text-[#00A8FF]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30 transition-all duration-300 ${isOpen ? 'bg-[#2A2A35] rotate-45' : 'bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] hover:scale-105'}`}
        >
          <Upload className={`w-6 h-6 text-white ${isOpen ? 'rotate-[-45deg]' : ''}`} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />
    </>
  );
}
