import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function PullToRefresh({ onRefresh, isRefreshing }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const threshold = 80;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        if (distance > 0) {
          setIsPulling(true);
          setPullDistance(Math.min(distance, threshold * 1.5));
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        await onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
      setStartY(0);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, isRefreshing, onRefresh]);

  const showIndicator = isPulling || isRefreshing;
  const rotation = Math.min((pullDistance / threshold) * 360, 360);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          className="pull-to-refresh"
        >
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
            <RefreshCw
              className="w-6 h-6 text-[#6C5CE7]"
              style={{
                transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
                animation: isRefreshing ? 'spin 1s linear infinite' : undefined,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
