export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl: string; // New field for video preview
  duration: number;
  requiredMedia: {
    id: string;
    type: 'image' | 'video';
    aspectRatio: '9:16' | '1:1' | '16:9';
    label: string;
  }[];
}

export const mockTemplates: Template[] = [
  {
    id: 't1',
    name: 'Cyberpunk Glitch',
    description: 'Futuristic glitch transitions for your best moments',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535136029863-4a3813f41eaa?w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 15,
    requiredMedia: [
      { id: 'm1', type: 'image', aspectRatio: '9:16', label: 'Cover Shot' },
      { id: 'm2', type: 'video', aspectRatio: '9:16', label: 'Main Action' },
      { id: 'm3', type: 'image', aspectRatio: '1:1', label: 'Detail Shot' },
    ]
  },
  {
    id: 't2',
    name: 'Neon Nights',
    description: 'Vibrant neon colors and fast cuts',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 10,
    requiredMedia: [
      { id: 'm1', type: 'video', aspectRatio: '9:16', label: 'Intro' },
      { id: 'm2', type: 'video', aspectRatio: '9:16', label: 'Drop' },
    ]
  },
  {
    id: 't3',
    name: 'Retro VHS',
    description: 'Old school cool with VHS noise overlay',
    thumbnailUrl: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 20,
    requiredMedia: [
      { id: 'm1', type: 'image', aspectRatio: '16:9', label: 'Landscape' },
      { id: 'm2', type: 'image', aspectRatio: '9:16', label: 'Portrait' },
      { id: 'm3', type: 'image', aspectRatio: '9:16', label: 'Portrait' },
      { id: 'm4', type: 'image', aspectRatio: '9:16', label: 'Portrait' },
    ]
  },
  {
    id: 't4',
    name: 'Cinematic Travel',
    description: 'Slow motion pans and dramatic fades',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 30,
    requiredMedia: [
      { id: 'm1', type: 'video', aspectRatio: '9:16', label: 'Scenery' },
      { id: 'm2', type: 'video', aspectRatio: '9:16', label: 'Movement' },
      { id: 'm3', type: 'image', aspectRatio: '9:16', label: 'Selfie' },
    ]
  }
];
