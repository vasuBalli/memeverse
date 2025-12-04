import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FullscreenReelViewer } from '../components/FullscreenReelViewer';
import { ReelViewerSkeleton } from '../components/SkeletonLoader';
import { mockMemes } from '../data/mockData';
import { Meme } from '../types';

export function ReelViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [reels, setReels] = useState<Meme[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have reels passed from navigation state
    if (location.state?.reels && location.state?.index !== undefined) {
      setReels(location.state.reels);
      setInitialIndex(location.state.index);
      setLoading(false);
    } else {
      // Fallback: load from mock data and find the reel
      const allReels = mockMemes;
      const index = allReels.findIndex((reel) => reel.id === id);

      if (index !== -1) {
        setReels(allReels);
        setInitialIndex(index);
      } else {
        // Reel not found, redirect to reels grid
        navigate('/reels');
      }
      setLoading(false);
    }
  }, [id, location.state, navigate]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleLike = (reelId: string) => {
    setReels(
      reels.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              liked: !reel.liked,
              likes: reel.liked ? reel.likes - 1 : reel.likes + 1,
            }
          : reel
      )
    );
  };

  const handleSave = (reelId: string) => {
    setReels(
      reels.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              saved: !reel.saved,
              saves: reel.saved ? reel.saves - 1 : reel.saves + 1,
            }
          : reel
      )
    );
  };

  if (loading) {
    return <ReelViewerSkeleton />;
  }

  if (reels.length === 0) {
    return null;
  }

  return (
    <FullscreenReelViewer
      reels={reels}
      initialIndex={initialIndex}
      onClose={handleClose}
      onLike={handleLike}
      onSave={handleSave}
    />
  );
}
