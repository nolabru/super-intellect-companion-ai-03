
import React from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithStats } from '@/types/newsletter';
import { PostAuthorHeader } from './post/PostAuthorHeader';
import { PostContent } from './post/PostContent';
import { PostMedia } from './post/PostMedia';
import { PostEngagementStats } from './post/PostEngagementStats';
import { DeletePostButton } from './post/DeletePostButton';

interface NewsletterPostProps {
  post: PostWithStats;
  onDelete?: (postId: string) => Promise<void>;
}

export const NewsletterPost: React.FC<NewsletterPostProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.email?.endsWith('@admin.com') || false;
  
  const {
    id,
    title,
    content,
    created_at,
    media_url,
    media_type,
    author
  } = post;

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(id);
    }
  };

  return (
    <Card className="overflow-hidden bg-black/20 backdrop-blur-sm border-white/5">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <PostAuthorHeader 
            authorName={author?.username}
            authorAvatar={author?.avatar_url}
            createdAt={created_at || new Date().toISOString()}
          />
          
          {isAdmin && onDelete && (
            <DeletePostButton onDelete={handleDelete} />
          )}
        </div>
        
        <PostContent title={title} content={content} />
        
        <PostMedia 
          mediaUrl={media_url}
          mediaType={media_type}
          title={title}
        />
        
        <PostEngagementStats 
          viewCount={post.view_count}
          likesCount={post.likes_count}
          commentsCount={post.comments_count}
        />
      </div>
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
