
import { supabase } from '@/integrations/supabase/client';

/**
 * Increments the view count for a post
 * @param postId The ID of the post to increment the view count for
 * @returns A promise that resolves when the view count has been incremented
 */
export const incrementViewCount = async (postId: string): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('increment_view_count', {
      post_id: postId,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
    }
  } catch (err) {
    console.error('Error incrementing view count:', err);
  }
};
  
/**
 * Increments the like count for a post
 * @param postId The ID of the post to increment the like count for
 * @returns A promise that resolves when the like count has been incremented
 */
export const incrementLikeCount = async (postId: string): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('increment_like_count', {
      post_id: postId,
    });

    if (error) {
      console.error('Error incrementing like count:', error);
    }
  } catch (err) {
    console.error('Error incrementing like count:', err);
  }
};
  
/**
 * Increments the share count for a post
 * @param postId The ID of the post to increment the share count for
 * @returns A promise that resolves when the share count has been incremented
 */
export const incrementShareCount = async (postId: string): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('increment_share_count', {
      post_id: postId,
    });

    if (error) {
      console.error('Error incrementing share count:', error);
    }
  } catch (err) {
    console.error('Error incrementing share count:', err);
  }
};
