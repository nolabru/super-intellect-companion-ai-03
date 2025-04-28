import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, MoreVertical, Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PostWithStats } from '@/types/newsletter';
import { newsletterService } from '@/services/newsletterService';
import { discussionService } from '@/services/discussionService';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface NewsletterPostProps {
  post: PostWithStats;
  onDelete?: (postId: string) => void;
}

const NewsletterPost: React.FC<NewsletterPostProps> = ({ post, onDelete }) => {
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [likeInProgress, setLikeInProgress] = useState(false);

  const handleLike = async () => {
    if (likeInProgress) return;
    
    setLikeInProgress(true);
    try {
      const result = await newsletterService.likePost(post.id);
      setIsLiked(result);
      setLikesCount(prevCount => result ? prevCount + 1 : prevCount - 1);
    } finally {
      setLikeInProgress(false);
    }
  };

  const handleViewComments = () => {
    navigate(`/feed/${post.id}`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
  };

  const handleDiscuss = async () => {
    if (!post || isCreatingDiscussion) return;
    
    setIsCreatingDiscussion(true);
    try {
      const result = await discussionService.createDiscussionFromPost(
        post.id,
        post.content,
        `Discussão: ${post.content.substring(0, 30)}...`
      );

      if (result.success && result.conversationId) {
        toast.success('Discussão criada com sucesso');
        navigate(`/${result.conversationId}`);
      } else {
        throw new Error('Falha ao criar discussão');
      }
    } catch (error) {
      console.error('Error starting discussion:', error);
      toast.error('Erro ao criar discussão');
    } finally {
      setIsCreatingDiscussion(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.published_at), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <Card className="w-full max-w-md mx-auto border-white/10 bg-inventu-dark/80 backdrop-blur-sm shadow-md mb-4">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarImage src={post.author?.avatar_url || ''} alt={post.author?.username || 'Admin'} />
              <AvatarFallback className="bg-inventu-blue text-white">
                {(post.author?.username || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">
                {post.author?.username || 'Administrador'}
              </p>
              <p className="text-xs text-white/60">{timeAgo}</p>
            </div>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-inventu-dark/90 border-white/10">
                <DropdownMenuItem
                  className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-500/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2 space-y-2">
        <p className="text-sm text-white/90 whitespace-pre-wrap">{post.content}</p>
        
        {post.media_url && post.media_type !== 'none' && (
          <div className="rounded-lg overflow-hidden my-2">
            {post.media_type === 'image' && (
              <AspectRatio ratio={4 / 5} className="bg-inventu-darker">
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </AspectRatio>
            )}
            
            {post.media_type === 'video' && (
              <AspectRatio ratio={4 / 5} className="bg-inventu-darker">
                <video
                  src={post.media_url}
                  className="object-cover w-full h-full"
                  controls
                  preload="metadata"
                />
              </AspectRatio>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 flex justify-between text-xs text-white/70">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-white/70 hover:text-white"
            onClick={handleLike}
            disabled={likeInProgress}
          >
            <Heart 
              className={cn("h-4 w-4 mr-1", isLiked && "fill-red-500 text-red-500")} 
            />
            {likesCount}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-white/70 hover:text-white"
            onClick={handleViewComments}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.comments_count || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-white/70 hover:text-white"
            onClick={handleDiscuss}
            disabled={isCreatingDiscussion}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Discutir
          </Button>
        </div>
        
        <div className="text-xs text-white/50">
          {post.view_count || 0} visualizações
        </div>
      </CardFooter>
    </Card>
  );
};

export const NewsletterPostSkeleton = () => {
  return (
    <Card className="w-full max-w-md mx-auto border-white/10 bg-inventu-dark/80 backdrop-blur-sm shadow-md mb-4">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        
        <div className="rounded-lg overflow-hidden my-2">
          <AspectRatio ratio={4 / 5}>
            <Skeleton className="h-full w-full" />
          </AspectRatio>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 flex justify-between text-xs">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
};

export default NewsletterPost;
