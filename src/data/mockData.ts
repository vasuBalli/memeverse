export interface Post {
  id: string;
  type: 'image' | 'video';
  file_url: string;
  images?: string[]; // For multiple image posts
  aspectRatio?: number; // For videos: width/height (e.g., 0.5625 for 9:16, 1.777 for 16:9)
  thumbnail?: string;
  title: string;
  tags: string[];
  deviceId: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  is_liked: boolean;
  is_bookmarked: boolean;
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('memeverse-device-id');
  if (!deviceId) {
    deviceId = `DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    localStorage.setItem('memeverse-device-id', deviceId);
  }
  return deviceId;
}

// export function formatNumber(num: number): string {
//   if (num >= 1000000) {
//     return (num / 1000000).toFixed(1) + 'M';
//   }
//   if (num >= 1000) {
//     return (num / 1000).toFixed(1) + 'K';
//   }
//   return num.toString();
// }
export function formatNumber(num?: number | null): string {
  const value = Number(num);

  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }

  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }

  return value.toString();
}
