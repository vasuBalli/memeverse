export interface Meme {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  tags: string[];
  deviceId: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  liked: boolean;
  saved: boolean;
  createdAt: string;
}

export interface ReelTile extends Meme {
  aspectRatio?: number;
  size?: 'small' | 'medium' | 'large';
}
