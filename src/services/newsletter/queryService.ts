
import { supabase } from '@/integrations/supabase/client';
import { NewsletterPost, PostWithStats } from '@/types/newsletter';
import { mapPostToFrontend } from './utils';

interface PaginatedPosts {
  data: PostWithStats[];
  totalCount: number;
}

/**
 * Gets all newsletter posts with pagination
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPosts = async (page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching posts:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching posts:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets all published newsletter posts with pagination
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPublishedPosts = async (page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching published posts:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching published posts:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets all newsletter posts by a user with pagination
 * @param userId The ID of the user to get posts for
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPostsByUserId = async (userId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching posts by user:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching posts by user:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets all published newsletter posts by a user with pagination
 * @param userId The ID of the user to get posts for
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPublishedPostsByUserId = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching published posts by user:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching published posts by user:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets posts by search term
 * @param searchTerm The search term to filter posts by
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPostsBySearchTerm = async (searchTerm: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .ilike('title', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching posts by search term:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching posts by search term:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets posts by category
 * @param category The category to filter posts by
 * @param page The page number to get
 * @param pageSize The number of posts per page
 * @returns An object containing the posts and the total count
 */
export const getPostsByCategory = async (category: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> => {
  try {
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize - 1;

    let { data, error, count } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' })
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching posts by category:', error);
      return { data: [], totalCount: 0 };
    }

    const posts = data ? data.map(post => mapPostToFrontend(post)) : [];
    const totalCount = count || 0;

    return { data: posts as PostWithStats[], totalCount };
  } catch (err) {
    console.error('Error fetching posts by category:', err);
    return { data: [], totalCount: 0 };
  }
};

/**
 * Gets popular posts ordered by view count
 * @param limit The maximum number of posts to return
 * @returns A list of popular posts
 */
export const getPopularPosts = async (limit: number = 5): Promise<NewsletterPost[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular posts:', error);
      return [];
    }

    return data ? data.map(post => mapPostToFrontend(post)) as NewsletterPost[] : [];
  } catch (err) {
    console.error('Error fetching popular posts:', err);
    return [];
  }
};

/**
 * Gets recent posts ordered by published date
 * @param limit The maximum number of posts to return
 * @returns A list of recent posts
 */
export const getRecentPosts = async (limit: number = 5): Promise<NewsletterPost[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent posts:', error);
      return [];
    }

    return data ? data.map(post => mapPostToFrontend(post)) as NewsletterPost[] : [];
  } catch (err) {
    console.error('Error fetching recent posts:', err);
    return [];
  }
};
