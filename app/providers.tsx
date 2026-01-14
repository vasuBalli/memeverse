"use client"
import { StoreProvider } from '@/context/StoreContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
