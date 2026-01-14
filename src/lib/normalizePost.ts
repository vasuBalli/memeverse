import { Post } from '@/data/mockData';

// export function normalizePostFromApi(data: any): Post {
//   return {
//     id: data.id,
//     type: data.type,
//     file_url: data.file_url,

//     thumbnail: data.thumbnail ?? '',
//     images: [],

//     title: data.title ?? '',
//     tags: data.tags ?? [],

//     likes: data.likes_count ?? 0,
//     views: data.views_count ?? 0,
//     comments: 0,
//     shares: 0,

//     deviceId: data.user_name ?? 'Unknown',

//     is_liked: data.is_liked ?? false,
//     is_bookmarked: data.is_bookmarked ?? false,
//   };
// }
function normalizePostFromApi(data: any): Post {
  return {
    id: data.id,
    type: data.type,

    // 🔥 MUST MATCH FEEDCARD
    file_url: data.file_url,
    title: data.title ?? '',

    thumbnail: data.thumbnail ?? '',
    images: [],

    tags: data.tags ?? [],

    likes: data.likes_count ?? 0,
    views: data.views_count ?? 0,
    comments: 0,
    shares: 0,

    deviceId: data.user_name ?? 'Unknown',

    is_liked: data.is_liked ?? false,
    is_bookmarked: data.is_bookmarked ?? false,
  };
}
