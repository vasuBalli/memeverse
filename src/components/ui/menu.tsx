// Menu.tsx (very small)
import React, { useState, useRef, useEffect } from 'react';

export function Menu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(s => !s)} aria-haspopup="true" aria-expanded={open} className="p-1 rounded-md">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 p-2 bg-[#111] border border-white/10 rounded-md shadow-lg z-50 min-w-[140px]">
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-left px-2 py-2 hover:bg-white/5 rounded flex items-center gap-2">
      {icon} <span>{children}</span>
    </button>
  );
}
