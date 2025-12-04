import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Home, Grid3x3 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function Header() {
  const location = useLocation();
  const deviceId = `DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const handleReelsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Coming soon in development");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0F] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex flex-col justify-center group h-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#6C5CE7] group-hover:text-[#00A8FF] transition-colors" strokeWidth={2} />
              <span className="gradient-text">MEMEVERSE</span>
            </div>
            <span className="text-[10px] text-[#00A8FF] ml-8 -mt-1 tracking-wider font-medium">INTERNET'S BEST</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavLink to="/feed" icon={Home} label="Feed" active={location.pathname === '/feed'} />
            
            {/* Reels Button - Visual only, no navigation */}
            <button 
              onClick={handleReelsClick}
              className="relative px-4 py-2 rounded-xl transition-colors group hover:bg-white/5 focus:outline-none"
            >
               <div className="flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5 text-[#6B6B7B] group-hover:text-[#A0A0B0] transition-colors" strokeWidth={2} />
                  <span className="text-sm text-[#6B6B7B] group-hover:text-[#A0A0B0] transition-colors">Reels</span>
               </div>
            </button>
          </nav>

          {/* Device ID */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15151F] border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#00A8FF] animate-pulse" />
            <span className="text-xs text-[#A0A0B0]">{deviceId}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function NavLink({ to, icon: Icon, label, active }: NavLinkProps) {
  return (
    <Link to={to} className={`relative px-4 py-2 rounded-xl transition-colors group ${active ? 'pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 transition-colors ${active ? 'text-[#6C5CE7]' : 'text-[#6B6B7B] group-hover:text-[#A0A0B0]'}`} strokeWidth={2} />
        <span className={`text-sm transition-colors ${active ? 'text-white' : 'text-[#6B6B7B] group-hover:text-[#A0A0B0]'}`}>
          {label}
        </span>
      </div>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-gradient-to-r from-[#6C5CE7]/10 to-[#00A8FF]/10 rounded-xl border border-[#6C5CE7]/20"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}
