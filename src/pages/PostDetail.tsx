
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { NewsletterPost, NewsletterPostSkeleton } from '@/components/newsletter/NewsletterPost';
import { CommentsList, CommentsListSkeleton } from '@/components/newsletter/CommentsList';
import CommentInput from '@/components/newsletter/CommentInput';
import { newsletterService } from '@/services/newsletterService';
import { PostWithStats, CommentWithUser } from '@/types/newsletter';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const PostDetail: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [post, setPost] = useState<PostWithStats | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!postId) return;
      
      try {
        setIsLoadingPost(true);
        const postData = await newsletterService.getPostById(postId);
        setPost(postData);
        
        // Increment view count
        await newsletterService.incrementViewCount(postId);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Erro ao carregar publicação');
      } finally {
        setIsLoadingPost(false);
      }
      
      try {
        setIsLoadingComments(true);
        const commentsData = await newsletterService.getComments(postId);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Erro ao carregar comentários');
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleAddComment = async (content: string) => {
    if (!postId) return;
    
    try {
      const newComment = await newsletterService.addComment(postId, content);
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        
        // Update comments count in post
        if (post) {
          setPost({
            ...post,
            comments_count: (post.comments_count || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    // Update comments count in post
    if (post) {
      setPost({
        ...post,
        comments_count: Math.max((post.comments_count || 0) - 1, 0)
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const success = await newsletterService.deletePost(postId);
      if (success) {
        toast.success('Publicação excluída com sucesso');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
          title="Detalhes da Publicação"
        />
        
        <main className="flex-1 overflow-hidden">
          {/* Back button */}
          <div className="sticky top-16 z-10 px-4 py-2 bg-inventu-darker border-b border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70"
              onClick={() => navigate('/feed')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o feed
            </Button>
          </div>
          
          {/* Use ScrollArea for better scrolling */}
          <ScrollArea className="h-[calc(100vh-7rem)]">
            {/* Content container */}
            <div className={cn(
              "mx-auto w-full max-w-md pb-safe",
              isMobile ? "px-4 pt-2 pb-24" : "px-8 py-8"
            )}>
              {isLoadingPost ? (
                <NewsletterPostSkeleton />
              ) : post ? (
                <NewsletterPost 
                  post={post} 
                  onDelete={handleDeletePost}
                />
              ) : (
                <div className="text-center p-8 text-white/60">
                  <p>Publicação não encontrada</p>
                </div>
              )}
              
              {post && !isLoadingPost && (
                <div className="mt-4 bg-inventu-dark/80 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="h-5 w-5 mr-2 text-inventu-blue" />
                    <h2 className="text-lg font-medium text-white">
                      Comentários ({post.comments_count || 0})
                    </h2>
                  </div>
                  
                  {isLoadingComments ? (
                    <CommentsListSkeleton />
                  ) : (
                    <CommentsList 
                      comments={comments}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  )}
                  
                  {user && (
                    <CommentInput 
                      onSubmit={handleAddComment}
                      disabled={!user}
                    />
                  )}
                  
                  {!user && (
                    <div className="mt-4 p-3 bg-inventu-darker/50 rounded-lg text-sm text-center text-white/70">
                      Faça login para adicionar um comentário
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default PostDetail;
