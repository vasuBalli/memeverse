import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function WelcomeSplash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F]">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#6C5CE7] via-[#00A8FF] to-[#FF3B6A] opacity-20 blur-3xl" />
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-[#6C5CE7]" strokeWidth={1.5} />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-2 gradient-text"
        >
          MEMEVERSE
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[#A0A0B0]"
        >
          Internet's Best
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="w-32 h-1 mx-auto mt-6 bg-gradient-to-r from-[#6C5CE7] via-[#00A8FF] to-[#FF3B6A] rounded-full"
        />
      </div>
    </div>
  );
}
