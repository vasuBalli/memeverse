export function ReelsGridSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl bg-[#1E1E2E] animate-shimmer ${
            i % 5 === 0 ? 'aspect-[9/19]' : 'aspect-square'
          }`}
        />
      ))}
    </>
  );
}
