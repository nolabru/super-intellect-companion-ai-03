
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import our new components
import PostDetailHeader from '@/components/newsletter/PostDetailHeader';
import PostDetailContent from '@/components/newsletter/PostDetailContent';
import PostCommentsSection from '@/components/newsletter/PostCommentsSection';
import usePostDetail from '@/hooks/usePostDetail';

const PostDetail: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    post,
    comments,
    isLoadingPost,
    isLoadingComments,
    refreshData,
    fetchComments,
  } = usePostDetail(postId);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCommentAdded = () => {
    fetchComments();
    
    // Update comments count in post
    if (post) {
      const updatedPost = {
        ...post,
        comments_count: (comments.length || 0) + 1
      };
      
      // This doesn't need to update the state since fetchComments will do that
    }
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
          <PostDetailHeader />
          
          {/* Use ScrollArea for better scrolling */}
          <ScrollArea className="h-[calc(100vh-7rem)]">
            {/* Content container */}
            <div className={cn(
              "mx-auto w-full max-w-md pb-safe",
              isMobile ? "px-4 pt-2 pb-24" : "px-8 py-8"
            )}>
              <PostDetailContent 
                postId={postId}
                post={post}
                isLoading={isLoadingPost}
              />
              
              {post && !isLoadingPost && (
                <PostCommentsSection
                  postId={postId || ''}
                  commentsCount={post.comments_count || 0}
                  comments={comments}
                  isLoading={isLoadingComments}
                  onCommentAdded={handleCommentAdded}
                />
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default PostDetail;
