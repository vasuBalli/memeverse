import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeSplash } from './components/WelcomeSplash';
import { FeedPage } from './components/FeedPage';
import { ReelsGridPage } from './components/ReelsGridPage';
import { ReelsViewer } from './components/ReelsViewer';
import { Toaster } from './components/ui/sonner';
import { PostsProvider } from './contexts/PostsContext';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('memeverse-visited');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        localStorage.setItem('memeverse-visited', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (showSplash) {
    return <WelcomeSplash />;
  }

  return (
    <PostsProvider>
    <Router>
      <div className="min-h-screen bg-[#0A0A0F]">
        <Routes>
          <Route path="/feed" element={
            <>
              <Header />
              <FeedPage />
            </>
          } />
          <Route path="/reels" element={
            <>
              <Header />
              <ReelsGridPage />
            </>
          } />
          <Route path="/reels/:id" element={<ReelsViewer />} />
          <Route path="/" element={<Navigate to="/feed" replace />} />
          {/* Catch-all route for any unmatched paths */}
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
    </PostsProvider>
  );
}