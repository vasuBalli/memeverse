import { Suspense } from 'react';

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading post...</div>}>
      {children}
    </Suspense>
  );
}
