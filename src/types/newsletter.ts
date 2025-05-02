
// Define types based on the database structure we defined in the client
import { Database } from '@/integrations/supabase/types';

// Define base types from the database
export type NewsletterPost = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  published_at: string | null;
  media_url: string | null;
  media_type: 'none' | 'image' | 'video' | 'audio' | null;
  view_count: number | null;
  like_count: number | null;
  share_count: number | null;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
  author_id?: string;
};

export type PostLike = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

// Enhanced types with additional fields
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
