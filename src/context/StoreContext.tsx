"use client"
import { createContext, useContext, useEffect, useState } from 'react';

interface StoreContextType {
  likedPostIds: string[];
  bookmarkedPostIds: string[];
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  isLiked: (postId: string) => boolean;
  isBookmarked: (postId: string) => boolean;
  bookmarks: string[]; // Alias for compatibility
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLikes = localStorage.getItem('memeverse-likes');
      const savedBookmarks = localStorage.getItem('memeverse-bookmarks');
      
      if (savedLikes) setLikedPostIds(JSON.parse(savedLikes));
      if (savedBookmarks) setBookmarkedPostIds(JSON.parse(savedBookmarks));
      setIsLoaded(true);
    }
  }, []);

  // Persistence
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('memeverse-likes', JSON.stringify(likedPostIds));
    }
  }, [likedPostIds, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('memeverse-bookmarks', JSON.stringify(bookmarkedPostIds));
    }
  }, [bookmarkedPostIds, isLoaded]);

  const toggleLike = (postId: string) => {
    setLikedPostIds(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPostIds(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const isLiked = (postId: string) => likedPostIds.includes(postId);
  const isBookmarked = (postId: string) => bookmarkedPostIds.includes(postId);

  return (
    <StoreContext.Provider value={{
      likedPostIds,
      bookmarkedPostIds,
      bookmarks: bookmarkedPostIds, // Alias
      toggleLike,
      toggleBookmark,
      isLiked,
      isBookmarked
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
