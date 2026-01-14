"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Home, LayoutTemplate, User, Bookmark } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function Header() {
  const [deviceId, setDeviceId] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setDeviceId(`DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  }, []);

  const isTemplates = pathname?.startsWith('/templates');
  const isFeed = pathname === '/feed' || pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/feed" className="flex items-center gap-2 group w-1/3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00A8FF]/20 group-hover:from-[#6C5CE7]/30 group-hover:to-[#00A8FF]/30 transition-colors">
              <Sparkles className="w-5 h-5 text-[#6C5CE7]" strokeWidth={2} />
            </div>
            <span className="hidden sm:block gradient-text text-lg font-bold tracking-tight">MEMEVERSE</span>
          </Link>

          {/* Center: Navigation Toggle */}
          <div className="flex-1 flex justify-center">
             <div className="flex items-center gap-1 p-1 rounded-full bg-[#15151F] border border-white/5">
                <Link 
                  href="/feed" 
                  className={`relative w-12 h-10 rounded-full flex items-center justify-center transition-colors ${isFeed ? 'text-white' : 'text-[#6B6B7B] hover:text-white'}`}
                >
                  {isFeed && (
                    <motion.div
                      layoutId="headerToggle"
                      className="absolute inset-0 bg-[#2A2A35] rounded-full shadow-sm border border-white/5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10"><Home className="w-5 h-5" /></span>
                </Link>
                
                <Link 
                  href="/templates" 
                  className={`relative w-12 h-10 rounded-full flex items-center justify-center transition-colors ${isTemplates ? 'text-white' : 'text-[#6B6B7B] hover:text-white'}`}
                >
                  {isTemplates && (
                    <motion.div
                      layoutId="headerToggle"
                      className="absolute inset-0 bg-[#2A2A35] rounded-full shadow-sm border border-white/5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10"><LayoutTemplate className="w-5 h-5" /></span>
                </Link>
             </div>
          </div>

          {/* Right: Profile / Menu */}
          <div className="w-1/3 flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-[#6B6B7B] hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
                   <div className="w-9 h-9 rounded-full bg-[#15151F] flex items-center justify-center border border-white/10">
                      <User className="w-5 h-5" />
                   </div>
                   <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00A8FF] rounded-full border-2 border-[#0A0A0F]" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0A0A0F] border-l border-white/10 w-[280px]">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="gradient-text text-xl">Profile</SheetTitle>
                  <p className="text-xs text-[#6B6B7B]">
                    Logged in as Guest ({deviceId.slice(0, 8)})
                  </p>
                </SheetHeader>
                
                <div className="space-y-2">
                  <Link 
                    href="/bookmarks" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#15151F] text-white hover:bg-[#1E1E2E] transition-colors group"
                  >
                    <Bookmark className="w-5 h-5 text-[#6C5CE7] group-hover:text-[#00A8FF] transition-colors" />
                    <span className="font-medium">Saved Posts</span>
                  </Link>
                  
                  {/* Placeholder items */}
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <p className="text-xs font-semibold text-[#6B6B7B] uppercase tracking-wider mb-2 px-2">Settings</p>
                    <button 
                      onClick={() => toast.info('Edit Profile coming soon')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B6B7B] hover:bg-white/5 transition-colors text-left"
                    >
                      <User className="w-5 h-5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#15151F] to-[#0A0A0F] border border-white/5">
                    <p className="text-xs text-[#6B6B7B] mb-1">Session ID</p>
                    <p className="text-xs font-mono text-[#00A8FF] break-all">{deviceId}</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
