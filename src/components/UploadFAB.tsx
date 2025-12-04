import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function UploadFAB() {
  const handleClick = () => {
    toast.info('Upload feature coming soon!', {
      description: 'Stay tuned for the ability to upload your own memes and videos.',
    });
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00A8FF] flex items-center justify-center shadow-lg neon-glow z-40 hover:shadow-xl transition-shadow"
    >
      <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
    </motion.button>
  );
}
