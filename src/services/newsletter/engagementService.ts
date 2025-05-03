
import { supabase } from '@/integrations/supabase/client';

/**
 * Increments the view count for a post
 * @param postId The ID of the post to increment the view count for
 * @returns A promise that resolves when the view count has been incremented
 */
export const incrementViewCount = async (postId: string): Promise<void> => {
  try {
    // First fetch the current view_count
    const { data, error: fetchError } = await supabase
      .from('newsletter_posts')
      .select('view_count')
      .eq('id', postId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching view count:', fetchError);
      return;
    }
    
    const currentViewCount = data.view_count || 0;
    
    // Then update it with the incremented value
    const { error } = await supabase
      .from('newsletter_posts')
      .update({ view_count: currentViewCount + 1 })
      .eq('id', postId);

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
    // Need to check if the column exists in the table
    const { data: tableData, error: tableError } = await supabase
      .from('newsletter_posts')
      .select('like_count')
      .eq('id', postId)
      .single();
    
    if (tableError) {
      console.error('Error checking like_count column:', tableError);
      return;
    }
    
    // If like_count is defined in the response, it means the column exists
    if ('like_count' in tableData) {
      const currentLikeCount = tableData.like_count || 0;
      
      const { error } = await supabase
        .from('newsletter_posts')
        .update({ like_count: currentLikeCount + 1 })
        .eq('id', postId);
  
      if (error) {
        console.error('Error incrementing like count:', error);
      }
    } else {
      console.error('like_count column does not exist in newsletter_posts table');
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
    // Need to check if the column exists in the table
    const { data: tableData, error: tableError } = await supabase
      .from('newsletter_posts')
      .select('share_count')
      .eq('id', postId)
      .single();
    
    if (tableError) {
      console.error('Error checking share_count column:', tableError);
      return;
    }
    
    // If share_count is defined in the response, it means the column exists
    if ('share_count' in tableData) {
      const currentShareCount = tableData.share_count || 0;
      
      const { error } = await supabase
        .from('newsletter_posts')
        .update({ share_count: currentShareCount + 1 })
        .eq('id', postId);
  
      if (error) {
        console.error('Error incrementing share count:', error);
      }
    } else {
      console.error('share_count column does not exist in newsletter_posts table');
    }
  } catch (err) {
    console.error('Error incrementing share count:', err);
  }
};
