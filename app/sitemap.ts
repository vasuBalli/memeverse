import type { MetadataRoute } from 'next';

async function getAllPostIds(): Promise<string[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts/ids`,
    { cache: 'no-store' }
  );

  if (!res.ok) return [];

  const json = await res.json();
  return json?.data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://memeverse.in';

  const postIds = await getAllPostIds();

  const postUrls: MetadataRoute.Sitemap = postIds.map((id) => ({
    url: `${baseUrl}/post/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly', // ✅ literal, not string
    priority: 0.7,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily', // ✅ literal
      priority: 1,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly', // ✅ literal
      priority: 0.9,
    },
    ...postUrls,
  ];
}
