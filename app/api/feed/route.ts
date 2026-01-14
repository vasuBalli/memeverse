import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') ?? '1';

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_API_BASE}/api/feed?page=${page}`,
    { cache: 'no-store' }
  );

  const json = await res.json();

  return NextResponse.json(
    Array.isArray(json?.data) ? json.data : []  
  );
}
