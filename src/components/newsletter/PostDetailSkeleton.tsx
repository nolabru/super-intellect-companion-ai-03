
import React from 'react';
import { NewsletterPostSkeleton } from '@/components/newsletter/NewsletterPost';
import { CommentsListSkeleton } from '@/components/newsletter/CommentsList';

const PostDetailSkeleton: React.FC = () => {
  return (
    <>
      <NewsletterPostSkeleton />
      <div className="mt-4 bg-inventu-dark/80 backdrop-blur-sm p-4 rounded-xl border border-white/10">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 mr-2 bg-inventu-gray/20 rounded animate-pulse" />
          <div className="h-5 w-32 bg-inventu-gray/20 rounded animate-pulse" />
        </div>
        <CommentsListSkeleton />
      </div>
    </>
  );
};

export default PostDetailSkeleton;
