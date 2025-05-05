
import { supabase } from '@/integrations/supabase/client';
import { CommentWithUser } from '@/types/newsletter';
import { getUserInfo } from './utils';

/**
 * Adds a comment to a post
 * @param postId The ID of the post to add a comment to
 * @param content The content of the comment
 * @returns The new comment, or null if an error occurred
 */
export const addComment = async (postId: string, content: string): Promise<CommentWithUser | null> => {
  try {
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    const userId = user?.id;
    
    if (!userId) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    // Add user information to the comment
    const userInfo = await getUserInfo(userId);
    
    return {
      ...data,
      username: userInfo.username || 'Usuário',
      display_name: null,
      avatar_url: userInfo.avatar_url || null,
      user: userInfo
    };
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
};

/**
 * Gets all comments for a post
 * @param postId The ID of the post to get comments for
 * @returns A list of comments
 */
export const getComments = async (postId: string): Promise<CommentWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Get user info for each comment
    const commentsWithUsers: CommentWithUser[] = [];
    
    for (const comment of data || []) {
      const userInfo = await getUserInfo(comment.user_id);
      commentsWithUsers.push({
        ...comment,
        username: userInfo.username || 'Usuário',
        display_name: null,
        avatar_url: userInfo.avatar_url || null,
        user: userInfo
      });
    }

    return commentsWithUsers;
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
};

/**
 * Deletes a comment
 * @param commentId The ID of the comment to delete
 * @returns True if the comment was deleted, false otherwise
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting comment:', err);
    return false;
  }
};
