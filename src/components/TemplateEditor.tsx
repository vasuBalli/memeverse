"use client"
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mockTemplates } from '../data/mockTemplates';
import { ArrowLeft, Upload, X, AlertCircle, CheckCircle2, Play, Pause, Volume2, VolumeX, Edit2, Plus, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { MediaCropper, CropData } from './MediaCropper';
import Image from 'next/image';

// Helper to convert aspect ratio string "9:16" to number 0.5625
const parseRatio = (ratioStr: string): number => {
  const [w, h] = ratioStr.split(':').map(Number);
  return w / h;
};

export function TemplateEditor() {
  const params = useParams();
  const id = params?.id as string;
  const template = mockTemplates.find(t => t.id === id);
  const inputRef = useRef<HTMLInputElement | null>(null);

  
  // Store crop data instead of just the file
  const [uploads, setUploads] = useState<Record<string, CropData>>({});
  
  // State for the cropping modal
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-white mb-4">Template not found</h2>
        <Link href="/templates" className="text-[#6C5CE7] hover:underline">Back to Templates</Link>
      </div>
    );
  }

  const handleFileSelect = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      const type = template.requiredMedia.find(m => m.id === slotId)?.type;
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }

      // Open cropper
      setActiveSlotId(slotId);
      setPendingFile(file);
      
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleCropConfirm = (data: CropData) => {
    if (activeSlotId) {
      setUploads(prev => ({ ...prev, [activeSlotId]: data }));
      setActiveSlotId(null);
      setPendingFile(null);
      toast.success('Media added!');
    }
  };

  const handleRemove = (slotId: string) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[slotId];
      return newUploads;
    });
  };

  const handleCreate = () => {
    const missing = template.requiredMedia.filter(m => !uploads[m.id]);
    if (missing.length > 0) {
      toast.error(`Please fill all ${template.requiredMedia.length} slots`);
      return;
    }
    
    // Simulate processing
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Creating your masterpiece...',
      success: 'Video created successfully!',
      error: 'Something went wrong',
    });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      {/* Cropper Modal */}
      <AnimatePresence>
        {activeSlotId && pendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <MediaCropper 
              file={pendingFile}
              aspectRatio={parseRatio(template.requiredMedia.find(m => m.id === activeSlotId)!.aspectRatio)}
              onConfirm={handleCropConfirm}
              onCancel={() => {
                setActiveSlotId(null);
                setPendingFile(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/templates" className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">{template.name}</h2>
            <p className="text-sm text-[#6B6B7B]">Add your media to create this video</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Section */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="sticky top-24 w-full flex flex-col items-center">
               <motion.div 
                 className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl aspect-[9/16] max-w-[300px] w-full"
               >
                 <video
                   ref={videoRef}
                   src={template.previewVideoUrl}
                   className="w-full h-full object-cover"
                   loop
                   autoPlay
                   playsInline
                   muted={isMuted}
                 />
                 
                 {/* Video Controls Overlay */}
                 <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={toggleMute} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={togglePlay} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                 </div>
               </motion.div>
               
               <p className="text-xs text-[#6B6B7B] mt-4 text-center max-w-[300px]">
                 Preview of the final result. Your media will be automatically inserted into the template's slots.
               </p>
            </div>
          </div>

          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#15151F]/50 rounded-xl p-4 border border-dashed border-white/10 mb-6">
              <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6C5CE7]" />
                How it works
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. Click a slot to upload your media.<br/>
                2. Use the on-screen editor to crop and position your media to fit the template.<br/>
                3. Once all slots are filled, create your video!
              </p>
            </div>

            {template.requiredMedia.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#15151F] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#2A2A35] text-xs flex items-center justify-center text-gray-400">
                        {index + 1}
                      </span>
                      {slot.label}
                    </h4>
                    <p className="text-xs text-[#6B6B7B] mt-1 ml-8">
                      {slot.type === 'image' ? 'Photo' : 'Video'} • Required {slot.aspectRatio}
                    </p>
                  </div>
                  {uploads[slot.id] ? (
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setPendingFile(uploads[slot.id].file);
                          setActiveSlotId(slot.id);
                        }}
                        className="p-2 hover:bg-white/5 rounded-full text-blue-400 transition-colors"
                        title="Edit Crop"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleRemove(slot.id)}
                        className="p-2 hover:bg-white/5 rounded-full text-red-400 transition-colors"
                        title="Remove"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      Required
                    </div>
                  )}
                </div>

                {uploads[slot.id] ? (
                  // Preview of the cropped media
                  <div 
                    className="relative mx-auto rounded-lg overflow-hidden bg-black/50 border border-white/10"
                    style={{ 
                      aspectRatio: parseRatio(slot.aspectRatio),
                      maxHeight: '200px',
                      maxWidth: '100%'
                    }}
                  >
                     <div 
                       className="w-full h-full relative"
                       style={{
                         transform: `scale(${uploads[slot.id].scale})`,
                         transformOrigin: 'center',
                       }}
                     >
                        {slot.type === 'image' || uploads[slot.id].file.type.startsWith('image/') ? (
                          <Image 
                            src={URL.createObjectURL(uploads[slot.id].file)} 
                            alt="Upload" 
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${uploads[slot.id].x}% ${uploads[slot.id].y}%` }}
                          />
                        ) : (
                          <video 
                            src={URL.createObjectURL(uploads[slot.id].file)}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${uploads[slot.id].x}% ${uploads[slot.id].y}%` }}
                            muted
                          />
                        )}
                     </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRefs.current[slot.id]?.click()}
                    className="border-2 border-dashed border-white/10 rounded-lg h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#6C5CE7] hover:bg-[#6C5CE7]/5 transition-all group"
                  >
                    <div className="p-4 rounded-full bg-[#2A2A35] group-hover:scale-110 transition-transform">
                      {slot.type === 'image' ? (
                        <ImageIcon className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#6C5CE7]" />
                      ) : (
                        <VideoIcon className="w-6 h-6 text-[#6B6B7B] group-hover:text-[#6C5CE7]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <Plus className="w-4 h-4 text-[#6C5CE7]" />
                       <span className="text-xs font-bold text-[#6B6B7B] group-hover:text-white transition-colors">
                         Select {slot.type === 'image' ? 'Image' : 'Video'}
                       </span>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={inputRef}
                  className="hidden"
                  accept={slot.type === 'image' ? "image/*" : "video/*"}
                  onChange={(e) => handleFileSelect(slot.id, e)}
                />
              </motion.div>
            ))}

            <button
              onClick={handleCreate}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00A8FF] text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[#6C5CE7]/20 mt-8"
            >
              <CheckCircle2 className="w-6 h-6" />
              Create Video
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
