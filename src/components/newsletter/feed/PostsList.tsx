
import React from 'react';
import { NewsletterPost, NewsletterPostSkeleton } from '@/components/newsletter/NewsletterPost';
import { EmptyFeed } from './EmptyFeed';
import { PostWithStats } from '@/types/newsletter';

interface PostsListProps {
  posts: PostWithStats[];
  isLoading: boolean;
  onDelete: (postId: string) => Promise<void>;
}

export const PostsList: React.FC<PostsListProps> = ({ posts, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => <NewsletterPostSkeleton key={i} />)}
      </div>
    );
  }
  
  if (posts.length === 0) {
    return <EmptyFeed />;
  }
  
  return (
    <div className="space-y-6">
      {posts.map(post => (
        <NewsletterPost key={post.id} post={post} onDelete={onDelete} />
      ))}
    </div>
  );
};
