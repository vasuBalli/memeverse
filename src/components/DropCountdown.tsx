import { useState, useEffect } from 'react';
import { Timer, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function DropCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      
      // Set target to 6 PM (18:00) today
      target.setHours(18, 0, 0, 0);

      // If it's already past 6 PM, set target to 6 PM tomorrow
      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/20 to-[#00A8FF]/20 border border-[#6C5CE7]/30 backdrop-blur-sm relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6C5CE7] to-[#00A8FF]" />
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#6C5CE7]/20 text-[#6C5CE7] dark:text-[#9D8CFF]">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
              Next Drop Incoming <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fresh memes served daily at 6 PM</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono font-bold text-xl text-gray-900 dark:text-white">
          <div className="bg-white dark:bg-[#15151F] px-2 py-1 rounded border border-gray-200 dark:border-white/10 min-w-[2ch] text-center">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <span className="text-[#6C5CE7]">:</span>
          <div className="bg-white dark:bg-[#15151F] px-2 py-1 rounded border border-gray-200 dark:border-white/10 min-w-[2ch] text-center">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <span className="text-[#6C5CE7]">:</span>
          <div className="bg-white dark:bg-[#15151F] px-2 py-1 rounded border border-gray-200 dark:border-white/10 min-w-[2ch] text-center">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
