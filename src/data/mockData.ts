export interface Post {
  id: string;
  type: 'image' | 'video';
  title: string;
  url: string;
  images?: string[]; // For multiple image posts
  aspectRatio?: number; // For videos: width/height (e.g., 0.5625 for 9:16, 1.777 for 16:9)
  thumbnail?: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  lqip?:string;
  username?:string;
}

export const mockPosts: Post[] = []

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}