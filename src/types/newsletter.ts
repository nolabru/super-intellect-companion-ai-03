
import { Database } from '@/integrations/supabase/types';

export type NewsletterPost = Database['public']['Tables']['newsletter_posts']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];

export interface PostWithStats extends NewsletterPost {
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
  author?: {
    username?: string;
    avatar_url?: string;
  };
}

export type CommentWithUser = PostComment & {
  user?: {
    username?: string;
    avatar_url?: string;
  };
};
