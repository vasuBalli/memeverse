import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get('post_id');

  if (!post_id) {
    return NextResponse.json(
      { error: 'Missing post_id' },
      { status: 400 }
    );
  }

  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_API_BASE}/api/post-details/?post_id=${post_id}`,
    { cache: 'no-store' }
  );

  const data = await backendRes.json();
  return NextResponse.json(data);
}
