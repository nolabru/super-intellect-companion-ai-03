
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { FeedHeader } from '@/components/newsletter/feed/FeedHeader';
import { PostsList } from '@/components/newsletter/feed/PostsList';
import { useNewsFeed } from '@/hooks/useNewsFeed';

const NewsFeed: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const { isAdmin } = useAdminCheck();
  const { posts, isLoading, handleDeletePost } = useNewsFeed();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-inventu-darker">
        <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && (
        <div className={cn("fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300", 
          sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" 
          onClick={toggleSidebar}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark" 
            onClick={e => e.stopPropagation()}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>
      )}

      <div className={cn("flex min-h-screen w-full flex-col transition-all duration-300", 
        !isMobile && sidebarOpen && "pl-64")}>
        <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title="Newsletter" />
        
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className={cn("mx-auto w-full max-w-md pb-safe", 
              isMobile ? "px-4 pt-2 pb-24" : "px-8 py-8")}>
              
              <FeedHeader isAdmin={isAdmin} />
              <PostsList 
                posts={posts} 
                isLoading={isLoading} 
                onDelete={handleDeletePost} 
              />
              
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default NewsFeed;
