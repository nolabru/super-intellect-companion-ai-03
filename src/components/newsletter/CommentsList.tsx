
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentWithUser } from '@/types/newsletter';
import { useAuth } from '@/contexts/AuthContext';
import { newsletterService } from '@/services/newsletterService';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentsListProps {
  comments: CommentWithUser[];
  onCommentDeleted: (commentId: string) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({ comments, onCommentDeleted }) => {
  const { user, isAdmin } = useAuth();
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set());
  
  const handleDeleteComment = async (commentId: string) => {
    setDeletingComments(prev => new Set(prev).add(commentId));
    try {
      const success = await newsletterService.deleteComment(commentId);
      if (success) {
        onCommentDeleted(commentId);
        toast.success('Comentário excluído com sucesso');
      }
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  if (comments.length === 0) {
    return (
      <div className="py-4 text-center text-white/50 text-sm">
        Nenhum comentário ainda. Seja o primeiro a comentar!
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      {comments.map((comment) => {
        const isAuthor = user?.id === comment.user_id;
        const canDelete = isAuthor || isAdmin;
        const isDeleting = deletingComments.has(comment.id);

        return (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-inventu-darker/50">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.user?.avatar_url || ''} />
              <AvatarFallback className="bg-inventu-blue/30 text-white">
                {(comment.user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">
                    {comment.user?.username || 'Usuário'}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
                
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white/50 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-sm mt-1 text-white/90 break-words whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CommentsListSkeleton = () => {
  return (
    <div className="space-y-4 mt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-inventu-darker/50">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
