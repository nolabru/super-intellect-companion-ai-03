
import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the total number of newsletter posts
 * @returns The total number of newsletter posts
 */
export const getTotalPostsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total posts count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total posts count:', err);
    return 0;
  }
};

/**
 * Gets the total number of published newsletter posts
 * @returns The total number of published newsletter posts
 */
export const getTotalPublishedPostsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching total published posts count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total published posts count:', err);
    return 0;
  }
};

/**
 * Gets the total number of newsletter posts by a user
 * @param userId The ID of the user to get posts for
 * @returns The total number of newsletter posts by the user
 */
export const getTotalPostsCountByUserId = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);

    if (error) {
      console.error('Error fetching total posts count by user:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total posts count by user:', err);
    return 0;
  }
};

/**
 * Gets the total number of published newsletter posts by a user
 * @param userId The ID of the user to get posts for
 * @returns The total number of published newsletter posts by the user
 */
export const getTotalPublishedPostsCountByUserId = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching total published posts count by user:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total published posts count by user:', err);
    return 0;
  }
};

/**
 * Gets the total number of posts by search term
 * @param searchTerm The search term to filter posts by
 * @returns The total number of posts matching the search term
 */
export const getTotalPostsCountBySearchTerm = async (searchTerm: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .ilike('title', `%${searchTerm}%`);

    if (error) {
      console.error('Error fetching total posts count by search term:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total posts count by search term:', err);
    return 0;
  }
};

/**
 * Gets the total number of posts by category
 * @param category The category to filter posts by
 * @returns The total number of posts in the category
 */
export const getTotalPostsCountByCategory = async (category: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .eq('category', category);

    if (error) {
      console.error('Error fetching total posts count by category:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching total posts count by category:', err);
    return 0;
  }
};
