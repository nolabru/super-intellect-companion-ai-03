
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithStats } from '@/types/newsletter';
import { Calendar, Trash2, MessageSquare, Eye, Heart, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterPostProps {
  post: PostWithStats;
  onDelete?: (postId: string) => Promise<void>;
}

export const NewsletterPost: React.FC<NewsletterPostProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.email?.endsWith('@admin.com') || false;
  
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);

  const {
    id,
    title,
    content,
    created_at,
    updated_at,
    media_url,
    media_type,
    author_id,
    author
  } = post;

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(id);
      setConfirmDeleteDialogOpen(false);
    }
  };

  const formatPostDate = (dateStr: string) => {
    try {
      // Ensure we're working with a valid date string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      
      // Only show distance if post is less than 7 days old
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
      } else {
        return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data inválida";
    }
  };

  // Ensure we have a valid media_type for the MediaPlayer
  const safeMediaType = (media_type === 'image' || media_type === 'video' || media_type === 'audio') 
    ? media_type 
    : 'none';

  return (
    <Card className="overflow-hidden bg-black/20 backdrop-blur-sm border-white/5">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              {author?.avatar_url ? (
                <AvatarImage src={author.avatar_url} alt={author.username || 'Usuário'} />
              ) : (
                <AvatarFallback className="bg-inventu-blue">
                  {author?.username ? author.username[0].toUpperCase() : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm font-medium">{author?.username || 'Usuário'}</p>
              <div className="flex items-center text-xs text-white/50">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatPostDate(created_at || new Date().toISOString())}</span>
              </div>
            </div>
          </div>
          
          {isAdmin && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setConfirmDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
        
        <h3 className="mt-3 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap">{content}</p>
        
        {media_url && (
          <div className="mt-3">
            {safeMediaType === 'image' ? (
              <div 
                className="relative aspect-video rounded-md overflow-hidden cursor-pointer"
                onClick={() => setMediaDialogOpen(true)}
              >
                <img 
                  src={media_url} 
                  alt={title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : safeMediaType === 'video' ? (
              <div 
                className="relative aspect-video rounded-md overflow-hidden cursor-pointer bg-black/40"
                onClick={() => setMediaDialogOpen(true)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge className="bg-inventu-blue">Vídeo</Badge>
                </div>
              </div>
            ) : safeMediaType === 'audio' ? (
              <div 
                className="relative h-16 rounded-md overflow-hidden cursor-pointer bg-black/40"
                onClick={() => setMediaDialogOpen(true)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge className="bg-inventu-blue">Áudio</Badge>
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between text-white/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.view_count}</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.likes_count}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className={cn(
            "overflow-hidden",
            safeMediaType === 'image' || safeMediaType === 'video' ? "aspect-video" : "h-24"
          )}>
            <MediaPlayer 
              url={media_url || ''} 
              type={safeMediaType} 
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export const NewsletterPostSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden bg-black/20 backdrop-blur-sm border-white/5">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-inventu-gray/20 animate-pulse" />
          <div>
            <div className="h-4 w-24 bg-inventu-gray/20 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-inventu-gray/20 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="mt-3 h-5 w-3/4 bg-inventu-gray/20 rounded animate-pulse" />
        <div className="mt-2 space-y-1.5">
          <div className="h-3 w-full bg-inventu-gray/20 rounded animate-pulse" />
          <div className="h-3 w-11/12 bg-inventu-gray/20 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-inventu-gray/20 rounded animate-pulse" />
        </div>
        
        <div className="mt-3 h-32 w-full bg-inventu-gray/20 rounded animate-pulse" />
        
        <div className="mt-3 flex justify-between">
          <div className="h-4 w-20 bg-inventu-gray/20 rounded animate-pulse" />
          <div className="h-4 w-16 bg-inventu-gray/20 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};
