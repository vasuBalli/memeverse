// const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// if (!API_BASE) {
//   throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
// }

// export const api = {
//   feed: `${API_BASE}/feed`,
//   reels: `${API_BASE}/reels`,
//   like: `${API_BASE}/like/`,
//   bookmark: `${API_BASE}/bookmark`,
// };
export const api = {
  feed: '/api/feed',
  reels: '/api/reels',
  like: '/api/like',
  bookmark: '/api/bookmark',
};
