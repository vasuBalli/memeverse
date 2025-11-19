export function FeedSkeleton() {
  return (
    <div className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-[#1E1E2E] animate-shimmer" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-[#1E1E2E] rounded animate-shimmer mb-1" />
          <div className="w-20 h-3 bg-[#1E1E2E] rounded animate-shimmer" />
        </div>
      </div>

      {/* Media skeleton */}
      <div className="aspect-[4/5] bg-[#1E1E2E] animate-shimmer" />

      {/* Actions skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1E1E2E] animate-shimmer" />
          <div className="w-12 h-4 bg-[#1E1E2E] rounded animate-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1E1E2E] animate-shimmer" />
          <div className="w-12 h-4 bg-[#1E1E2E] rounded animate-shimmer" />
        </div>
      </div>

      {/* Caption skeleton */}
      <div className="px-4 py-3">
        <div className="w-full h-4 bg-[#1E1E2E] rounded animate-shimmer mb-2" />
        <div className="w-3/4 h-4 bg-[#1E1E2E] rounded animate-shimmer mb-3" />
        <div className="flex gap-2">
          <div className="w-20 h-6 bg-[#1E1E2E] rounded-full animate-shimmer" />
          <div className="w-24 h-6 bg-[#1E1E2E] rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
