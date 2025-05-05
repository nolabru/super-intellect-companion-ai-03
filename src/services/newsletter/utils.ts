
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
    title: post.title || post.content?.substring(0, 50) || '',
    content: post.content || '',
    author_id: post.author_id || '',
    user_id: post.author_id || '', // Map author_id to user_id for compatibility
    published_at: post.published_at || null,
    media_url: post.media_url || null,
    media_type: post.media_type || 'none',
    created_at: post.created_at || post.published_at || new Date().toISOString(),
    updated_at: post.updated_at || new Date().toISOString(),
    is_published: post.is_published || false,
    view_count: post.view_count || 0,
    likes_count: post.likes_count || 0,
    like_count: post.likes_count || 0,  // Add alias for likes_count
    comments_count: post.comments_count || 0,
    shares_count: post.shares_count || 0,
    user_has_liked: post.user_has_liked || false,
    author_name: post.author_name || '',
    author_avatar: post.author_avatar || null,
    author: {
      username: post.author_name || '',
      avatar_url: post.author_avatar || null
    }
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
