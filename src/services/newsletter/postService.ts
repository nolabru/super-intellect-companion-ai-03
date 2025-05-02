
import { supabase } from '@/integrations/supabase/client';
import { NewsletterPost, PostWithStats } from '@/types/newsletter';
import { mapPostToFrontend } from './utils';

interface PaginatedPosts {
  data: PostWithStats[];
  totalCount: number;
}

/**
 * Creates a new newsletter post
 * @param postData The data for the new post
 * @returns The new post, or null if an error occurred
 */
export const createPost = async (postData: Partial<NewsletterPost>): Promise<NewsletterPost | null> => {
  try {
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    const userId = user?.id;
    
    const { data, error } = await supabase
      .from('newsletter_posts')
      .insert([
        {
          ...postData,
          author_id: userId,
          content: postData.content || '',
          title: postData.title || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return null;
    }

    return data ? mapPostToFrontend(data) : null;
  } catch (err) {
    console.error('Error creating post:', err);
    return null;
  }
};

/**
 * Updates an existing newsletter post
 * @param id The ID of the post to update
 * @param updates The updates to apply
 * @returns The updated post, or null if an error occurred
 */
export const updatePost = async (id: string, updates: Partial<NewsletterPost>): Promise<NewsletterPost | null> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return null;
    }

    return data ? mapPostToFrontend(data) : null;
  } catch (err) {
    console.error('Error updating post:', err);
    return null;
  }
};

/**
 * Deletes a newsletter post
 * @param id The ID of the post to delete
 * @returns True if the post was deleted, false otherwise
 */
export const deletePost = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('newsletter_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting post:', err);
    return false;
  }
};

/**
 * Gets a newsletter post by ID
 * @param id The ID of the post to get
 * @returns The newsletter post, or null if not found
 */
export const getPostById = async (id: string): Promise<PostWithStats | null> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    return data ? mapPostToFrontend(data) : null;
  } catch (err) {
    console.error('Error fetching post:', err);
    return null;
  }
};

/**
 * Publishes a newsletter post
 * @param id The ID of the post to publish
 * @returns The published post, or null if an error occurred
 */
export const publishPost = async (id: string): Promise<NewsletterPost | null> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error publishing post:', error);
      return null;
    }

    return data ? mapPostToFrontend(data) : null;
  } catch (err) {
    console.error('Error publishing post:', err);
    return null;
  }
};

/**
 * Unpublishes a newsletter post
 * @param id The ID of the post to unpublish
 * @returns The unpublished post, or null if an error occurred
 */
export const unpublishPost = async (id: string): Promise<NewsletterPost | null> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .update({
        is_published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error unpublishing post:', error);
      return null;
    }

    return data ? mapPostToFrontend(data) : null;
  } catch (err) {
    console.error('Error unpublishing post:', err);
    return null;
  }
};
