
import { supabase } from '@/integrations/supabase/client';
import { PostWithStats, NewsletterPost } from '@/types/newsletter';

/**
 * Maps a database post to a frontend post
 * @param post The database post to map
 * @returns The mapped frontend post
 */
export const mapPostToFrontend = (post: any): PostWithStats => {
  return {
    id: post.id || '',
    title: post.title || '',
    content: post.content || '',
    user_id: post.author_id || '',
    author_id: post.author_id || '',
    published_at: post.published_at || null,
    media_url: post.media_url || null,
    media_type: (post.media_type as "none" | "image" | "video" | "audio") || 'none',
    view_count: post.view_count || 0,
    like_count: post.like_count || 0,
    share_count: post.share_count || 0,
    created_at: post.created_at || post.published_at || new Date().toISOString(),
    updated_at: post.updated_at || new Date().toISOString(),
    is_published: post.is_published || false,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    user_has_liked: post.user_has_liked || false
  };
};

/**
 * Gets user info from the profiles table
 * @param userId The ID of the user to get info for
 * @returns The user info
 */
export const getUserInfo = async (userId: string): Promise<{ username?: string; avatar_url?: string }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user info:', error);
      return {};
    }

    return data || {};
  } catch (err) {
    console.error('Error fetching user info:', err);
    return {};
  }
};
