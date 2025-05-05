
// Tipos para Newsletter e Posts
import { User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export type PostWithCounts = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  user_id?: string; // Add this field for compatibility
  is_published: boolean;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cover_image?: string | null;
  summary?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  view_count: number;
  likes_count: number; 
  like_count?: number; // Alias for likes_count for compatibility
  comments_count: number;
  shares_count: number;
  author_name?: string | null;
  author_avatar?: string | null;
  author?: { // Add author field as used in components
    username?: string;
    avatar_url?: string | null;
  };
  user_has_liked?: boolean; // Add this field for compatibility
};

// Alias para PostWithCounts para manter compatibilidade com o código existente
export type PostWithStats = PostWithCounts;

export type PostFilterParams = {
  limit?: number;
  offset?: number;
  onlyPublished?: boolean;
  authorId?: string | null;
  sortBy?: 'published_at' | 'view_count' | 'created_at';
  sortDirection?: 'asc' | 'desc';
};

export type PostFormData = {
  title: string;
  content: string;
  summary?: string;
  cover_image?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  is_published: boolean;
};

export type CommentWithUser = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user?: { // Add user field for compatibility with UI components
    username?: string;
    avatar_url?: string | null;
  };
};

export type NewsletterComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

export type PostDetailData = {
  post: PostWithCounts;
  comments: CommentWithUser[];
  commentCount: number;
  userHasLiked: boolean;
  relatedPosts: PostWithCounts[];
};

export type NewsletterPost = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  user_id?: string;
  is_published: boolean;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cover_image?: string | null;
  summary?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  view_count?: number;
  likes_count?: number;
  like_count?: number;
  comments_count?: number;
  shares_count?: number;
  author_name?: string | null;
  author_avatar?: string | null;
  author?: {
    username?: string;
    avatar_url?: string | null;
  };
  user_has_liked?: boolean;
};
