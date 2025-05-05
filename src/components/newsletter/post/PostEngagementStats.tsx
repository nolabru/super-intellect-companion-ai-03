
import React from 'react';
import { Eye, Heart, MessageSquare } from 'lucide-react';

interface PostEngagementStatsProps {
  viewCount: number;
  likesCount: number;
  commentsCount: number;
}

export const PostEngagementStats: React.FC<PostEngagementStatsProps> = ({
  viewCount,
  likesCount,
  commentsCount,
}) => {
  return (
    <div className="mt-3 flex items-center justify-between text-white/60">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          <span className="text-xs">{viewCount}</span>
        </div>
        <div className="flex items-center">
          <Heart className="h-4 w-4 mr-1" />
          <span className="text-xs">{likesCount}</span>
        </div>
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="text-xs">{commentsCount || 0}</span>
        </div>
      </div>
    </div>
  );
};
