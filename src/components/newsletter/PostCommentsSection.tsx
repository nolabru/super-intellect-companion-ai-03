
import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CommentsList, CommentsListSkeleton } from '@/components/newsletter/CommentsList';
import CommentInput from '@/components/newsletter/CommentInput';
import { CommentWithUser } from '@/types/newsletter';
import { useAuth } from '@/contexts/AuthContext';
import { newsletterService } from '@/services/newsletterService';
import { toast } from 'sonner';

interface PostCommentsSectionProps {
  postId: string;
  commentsCount: number;
  comments: CommentWithUser[];
  isLoading: boolean;
  onCommentAdded: () => void;
}

const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({
  postId,
  commentsCount,
  comments,
  isLoading,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddComment = async (content: string) => {
    if (!postId) return;
    
    try {
      setIsSubmitting(true);
      const newComment = await newsletterService.addComment(postId, content);
      if (newComment) {
        onCommentAdded();
        toast.success('Comentário adicionado com sucesso');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCommentDeleted = async (commentId: string) => {
    try {
      const success = await newsletterService.deleteComment(commentId);
      if (success) {
        onCommentAdded();
        toast.success('Comentário excluído com sucesso');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
    }
  };

  return (
    <div className="mt-4 bg-inventu-dark/80 backdrop-blur-sm p-4 rounded-xl border border-white/10">
      <div className="flex items-center mb-4">
        <MessageCircle className="h-5 w-5 mr-2 text-inventu-blue" />
        <h2 className="text-lg font-medium text-white">
          Comentários ({commentsCount || 0})
        </h2>
      </div>
      
      {isLoading ? (
        <CommentsListSkeleton />
      ) : (
        <CommentsList 
          comments={comments}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
      
      {user ? (
        <CommentInput 
          onSubmit={handleAddComment}
          disabled={isSubmitting || !user}
        />
      ) : (
        <div className="mt-4 p-3 bg-inventu-darker/50 rounded-lg text-sm text-center text-white/70">
          Faça login para adicionar um comentário
        </div>
      )}
    </div>
  );
};

export default PostCommentsSection;
