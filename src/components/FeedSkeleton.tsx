export function FeedSkeleton() {
  return (
    <div className="bg-[#15151F] rounded-2xl overflow-hidden border border-white/5">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-[#1E1E2E]" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-[#1E1E2E] rounded mb-1" />
          <div className="w-20 h-3 bg-[#1E1E2E] rounded" />
        </div>
      </div>

      {/* Media skeleton - Removed blinking effect, just a solid placeholder with subtle icon */}
      <div className="aspect-[4/5] bg-[#1E1E2E] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center opacity-20">
          </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center justify-end gap-4 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-[#1E1E2E]" />
        <div className="w-8 h-8 rounded-full bg-[#1E1E2E]" />
      </div>

      {/* Caption skeleton */}
      <div className="px-4 py-3">
        <div className="w-full h-4 bg-[#1E1E2E] rounded mb-2" />
        <div className="w-3/4 h-4 bg-[#1E1E2E] rounded mb-3" />
      </div>
    </div>
  );
}
