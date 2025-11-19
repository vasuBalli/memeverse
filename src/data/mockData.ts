export interface Post {
  id: string;
  type: 'image' | 'video';
  url: string;
  images?: string[]; // For multiple image posts
  aspectRatio?: number; // For videos: width/height (e.g., 0.5625 for 9:16, 1.777 for 16:9)
  thumbnail?: string;
  caption: string;
  tags: string[];
  deviceId: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export const mockPosts: Post[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=1000&fit=crop',
    caption: 'When the code finally works after 3 hours of debugging 😭',
    tags: ['coding', 'memes', 'developer'],
    deviceId: 'DEV-A7K9M2',
    likes: 12400,
    comments: 234,
    shares: 89,
    views: 45200
  },
  {
    id: '2',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    aspectRatio: 0.5625, // 9:16 vertical
    caption: 'POV: You discover a new life hack 🤯',
    tags: ['lifehack', 'viral', 'trending'],
    deviceId: 'DEV-B3X8N1',
    likes: 28900,
    comments: 567,
    shares: 234,
    views: 127000
  },
  {
    id: '3',
    type: 'image',
    images: [
      'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=1000&fit=crop'
    ],
    url: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=1000&fit=crop',
    caption: 'Me explaining my weekend plans to my friends',
    tags: ['relatable', 'weekend', 'funny'],
    deviceId: 'DEV-C2P5Q9',
    likes: 8700,
    comments: 156,
    shares: 43,
    views: 32100
  },
  {
    id: '4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    aspectRatio: 1.777, // 16:9 horizontal
    caption: 'This is what peak performance looks like 💪',
    tags: ['motivation', 'fitness', 'goals'],
    deviceId: 'DEV-D8L4R7',
    likes: 45200,
    comments: 892,
    shares: 567,
    views: 289000
  },
  {
    id: '5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=1000&fit=crop',
    caption: 'When someone says "it works on my machine" 🙃',
    tags: ['programming', 'devlife', 'tech'],
    deviceId: 'DEV-E1M6K3',
    likes: 19300,
    comments: 421,
    shares: 178,
    views: 67800
  },
  {
    id: '6',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    aspectRatio: 0.5625, // 9:16 vertical
    caption: 'The ultimate plot twist you didn\'t see coming 😱',
    tags: ['plottwist', 'viral', 'mindblown'],
    deviceId: 'DEV-F9N2L8',
    likes: 67800,
    comments: 1234,
    shares: 890,
    views: 456000
  },
  {
    id: '7',
    type: 'image',
    images: [
      'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=1000&fit=crop'
    ],
    url: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=1000&fit=crop',
    caption: 'Monday morning vs Friday afternoon energy ⚡',
    tags: ['mood', 'monday', 'friday'],
    deviceId: 'DEV-G4P7Q2',
    likes: 15600,
    comments: 289,
    shares: 123,
    views: 54300
  },
  {
    id: '8',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    aspectRatio: 1, // 1:1 square
    caption: 'How to win any argument: Step 1... 🎯',
    tags: ['tutorial', 'lifehack', 'comedy'],
    deviceId: 'DEV-H7R3S9',
    likes: 34500,
    comments: 678,
    shares: 345,
    views: 178000
  },
  {
    id: '9',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=1000&fit=crop',
    caption: 'Me pretending I understand the group chat reference 😅',
    tags: ['relatable', 'friendship', 'lol'],
    deviceId: 'DEV-I2T8U5',
    likes: 21700,
    comments: 456,
    shares: 189,
    views: 89400
  },
  {
    id: '10',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    aspectRatio: 0.5625, // 9:16 vertical
    caption: 'The most satisfying thing you\'ll see today 😌',
    tags: ['satisfying', 'oddlysatisfying', 'chill'],
    deviceId: 'DEV-J6V1W4',
    likes: 56700,
    comments: 934,
    shares: 678,
    views: 345000
  },
  {
    id: '11',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=1000&fit=crop',
    caption: 'When you finally get the joke 5 minutes later 💀',
    tags: ['mood', 'comedy', 'relatable'],
    deviceId: 'DEV-K9X4Y7',
    likes: 18900,
    comments: 312,
    shares: 145,
    views: 61200
  },
  {
    id: '12',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    aspectRatio: 1.777, // 16:9 horizontal
    caption: 'This changed my perspective on everything 🌟',
    tags: ['inspiration', 'motivation', 'viral'],
    deviceId: 'DEV-L3Z7A2',
    likes: 78900,
    comments: 1567,
    shares: 1234,
    views: 678000
  }
];

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('memeverse-device-id');
  if (!deviceId) {
    deviceId = `DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    localStorage.setItem('memeverse-device-id', deviceId);
  }
  return deviceId;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}