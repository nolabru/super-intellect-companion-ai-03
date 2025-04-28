import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import NewsletterPost, { NewsletterPostSkeleton } from '@/components/newsletter/NewsletterPost';
import { newsletterService } from '@/services/newsletterService';
import { PostWithStats } from '@/types/newsletter';
import { Loader2, Newspaper } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const NewsFeed: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAdminCheck();

  // Effect for scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const postsData = await newsletterService.getPosts();
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Erro ao carregar publicações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDeletePost = async (postId: string) => {
    try {
      const success = await newsletterService.deleteComment(postId);
      if (success) {
        setPosts(posts.filter(post => post.id !== postId));
        toast.success('Publicação excluída com sucesso');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
    }
  };

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
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        >
          <div 
            className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark"
            onClick={e => e.stopPropagation()}
          >
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex min-h-screen w-full flex-col transition-all duration-300",
        !isMobile && sidebarOpen && "pl-64"
      )}>
        <AppHeader 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
          title="Feed de Notícias"
        />
        
        <main className="flex-1 overflow-hidden">
          {/* Mobile Title */}
          {isMobile && (
            <div className={cn(
              "sticky top-16 z-20 px-4 py-3 backdrop-blur-lg transition-all duration-200",
              isScrolled ? "bg-inventu-darker/80 shadow-md" : "bg-transparent"
            )}>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-inventu-blue to-inventu-purple p-2 rounded-full">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <h1 className={cn(
                    "font-semibold text-white transition-all duration-200",
                    isScrolled ? "text-xl" : "text-2xl"
                  )}>Feed</h1>
                </div>
              </div>
            </div>
          )}

          {/* Use ScrollArea for better scrolling */}
          <ScrollArea className="h-[calc(100vh-4rem)]">
            {/* Content container with padding optimized for both mobile and desktop */}
            <div className={cn(
              "mx-auto w-full max-w-md pb-safe",
              isMobile ? "px-4 pt-2 pb-24" : "px-8 py-8"
            )}>
              {!isMobile && (
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-white">Feed de Notícias</h1>
                  {isAdmin && (
                    <Button 
                      variant="default" 
                      onClick={() => navigate('/feed/new')}
                      className="bg-inventu-blue hover:bg-inventu-blue/80"
                    >
                      Nova Publicação
                    </Button>
                  )}
                </div>
              )}
              
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => <NewsletterPostSkeleton key={i} />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center p-8 text-white/60">
                  <Newspaper className="mx-auto h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg">Nenhuma publicação ainda</p>
                  <p className="text-sm">Volte mais tarde para novidades</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => (
                    <NewsletterPost 
                      key={post.id} 
                      post={post} 
                      onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default NewsFeed;
