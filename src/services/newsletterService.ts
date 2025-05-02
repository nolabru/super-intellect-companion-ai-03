import { supabase } from '@/integrations/supabase/client';
import { NewsletterPost } from '@/types/newsletter';
import { PostgrestError } from '@supabase/supabase-js';

interface PaginatedPosts {
  data: NewsletterPost[];
  totalCount: number;
}

/**
 * Service for managing newsletter posts
 */
export const newsletterService = {
  /**
   * Creates a new newsletter post
   * @param postData The data for the new post
   * @returns The new post, or null if an error occurred
   */
  async createPost(postData: Partial<NewsletterPost>): Promise<NewsletterPost | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_posts')
        .insert([
          {
            ...postData,
            author_id: supabase.auth.currentUser?.id,
            user_id: supabase.auth.currentUser?.id,
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

      return data ? this.mapPostToFrontend(data) : null;
    } catch (err) {
      console.error('Error creating post:', err);
      return null;
    }
  },

  /**
   * Updates an existing newsletter post
   * @param id The ID of the post to update
   * @param updates The updates to apply
   * @returns The updated post, or null if an error occurred
   */
  async updatePost(id: string, updates: Partial<NewsletterPost>): Promise<NewsletterPost | null> {
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

      return data ? this.mapPostToFrontend(data) : null;
    } catch (err) {
      console.error('Error updating post:', err);
      return null;
    }
  },

  /**
   * Deletes a newsletter post
   * @param id The ID of the post to delete
   * @returns True if the post was deleted, false otherwise
   */
  async deletePost(id: string): Promise<boolean> {
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
  },

  /**
   * Gets a newsletter post by ID
   * @param id The ID of the post to get
   * @returns The newsletter post, or null if not found
   */
  async getPostById(id: string): Promise<NewsletterPost | null> {
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

      return data ? this.mapPostToFrontend(data) : null;
    } catch (err) {
      console.error('Error fetching post:', err);
      return null;
    }
  },

  /**
   * Publishes a newsletter post
   * @param id The ID of the post to publish
   * @returns The published post, or null if an error occurred
   */
  async publishPost(id: string): Promise<NewsletterPost | null> {
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

      return data ? this.mapPostToFrontend(data) : null;
    } catch (err) {
      console.error('Error publishing post:', err);
      return null;
    }
  },

  /**
   * Unpublishes a newsletter post
   * @param id The ID of the post to unpublish
   * @returns The unpublished post, or null if an error occurred
   */
  async unpublishPost(id: string): Promise<NewsletterPost | null> {
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

      return data ? this.mapPostToFrontend(data) : null;
    } catch (err) {
      console.error('Error unpublishing post:', err);
      return null;
    }
  },

  /**
   * Gets all newsletter posts with pagination
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
  async getPosts(page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> {
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

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching posts:', err);
      return { data: [], totalCount: 0 };
    }
  },

  /**
   * Gets all published newsletter posts with pagination
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
  async getPublishedPosts(page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> {
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

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching published posts:', err);
      return { data: [], totalCount: 0 };
    }
  },

  /**
   * Gets all newsletter posts by a user with pagination
   * @param userId The ID of the user to get posts for
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
  async getPostsByUserId(userId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> {
    try {
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize - 1;

      let { data, error, count } = await supabase
        .from('newsletter_posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        console.error('Error fetching posts by user:', error);
        return { data: [], totalCount: 0 };
      }

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching posts by user:', err);
      return { data: [], totalCount: 0 };
    }
  },

  /**
   * Gets all published newsletter posts by a user with pagination
   * @param userId The ID of the user to get posts for
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
  async getPublishedPostsByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedPosts> {
    try {
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize - 1;

      let { data, error, count } = await supabase
        .from('newsletter_posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        console.error('Error fetching published posts by user:', error);
        return { data: [], totalCount: 0 };
      }

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching published posts by user:', err);
      return { data: [], totalCount: 0 };
    }
  },

  /**
   * Gets the total number of newsletter posts
   * @returns The total number of newsletter posts
   */
  async getTotalPostsCount(): Promise<number> {
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
  },

  /**
   * Gets the total number of published newsletter posts
   * @returns The total number of published newsletter posts
   */
  async getTotalPublishedPostsCount(): Promise<number> {
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
  },

  /**
   * Gets the total number of newsletter posts by a user
   * @param userId The ID of the user to get posts for
   * @returns The total number of newsletter posts by the user
   */
  async getTotalPostsCountByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('newsletter_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching total posts count by user:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error fetching total posts count by user:', err);
      return 0;
    }
  },

  /**
   * Gets the total number of published newsletter posts by a user
   * @param userId The ID of the user to get posts for
   * @returns The total number of published newsletter posts by the user
   */
  async getTotalPublishedPostsCountByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('newsletter_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
  },

  /**
   * Maps a database post to a frontend post
   * @param post The database post to map
   * @returns The mapped frontend post
   */
  private mapPostToFrontend(post: any): NewsletterPost {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author_id,
      userId: post.user_id,
      isPublished: post.is_published,
      publishedAt: post.published_at,
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      viewCount: post.view_count,
      likeCount: post.like_count,
      shareCount: post.share_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    };
  },
  async incrementViewCount(postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_view_count', {
        post_id: postId,
      });

      if (error) {
        console.error('Error incrementing view count:', error);
      }
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  },
  async incrementLikeCount(postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_like_count', {
        post_id: postId,
      });

      if (error) {
        console.error('Error incrementing like count:', error);
      }
    } catch (err) {
      console.error('Error incrementing like count:', err);
    }
  },
  async incrementShareCount(postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_share_count', {
        post_id: postId,
      });

      if (error) {
        console.error('Error incrementing share count:', error);
      }
    } catch (err) {
      console.error('Error incrementing share count:', err);
    }
  },
  async getPopularPosts(limit: number = 5): Promise<NewsletterPost[]> {
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

      return data ? data.map(this.mapPostToFrontend) : [];
    } catch (err) {
      console.error('Error fetching popular posts:', err);
      return [];
    }
  },
  async getRecentPosts(limit: number = 5): Promise<NewsletterPost[]> {
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

      return data ? data.map(this.mapPostToFrontend) : [];
    } catch (err) {
      console.error('Error fetching recent posts:', err);
      return [];
    }
  },
  async getPostsBySearchTerm(searchTerm: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> {
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

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching posts by search term:', err);
      return { data: [], totalCount: 0 };
    }
  },
  async getTotalPostsCountBySearchTerm(searchTerm: string): Promise<number> {
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
  },
  async getPostsByCategory(category: string, page: number = 1, pageSize: number = 10): Promise<PaginatedPosts> {
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

      const posts = data ? data.map(this.mapPostToFrontend) : [];
      const totalCount = count || 0;

      return { data: posts, totalCount };
    } catch (err) {
      console.error('Error fetching posts by category:', err);
      return { data: [], totalCount: 0 };
    }
  },
  async getTotalPostsCountByCategory(category: string): Promise<number> {
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
  },
  /**
   * Maps a database post to a frontend post
   * @param post The database post to map
   * @returns The mapped frontend post
   */
  mapPostToFrontend(post: any): NewsletterPost {
    return {
      id: post.id,
      title: post.title || '', // Add fallback for missing title
      content: post.content,
      authorId: post.author_id,
      userId: post.user_id || post.author_id, // Use author_id as fallback for missing user_id
      isPublished: post.is_published,
      publishedAt: post.published_at,
      // Cast media_type to the correct type or default to 'none'
      mediaType: (post.media_type as "none" | "image" | "video" | "audio") || 'none',
      mediaUrl: post.media_url || null,
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0, // Add fallback for missing like_count
      shareCount: post.share_count || 0, // Add fallback for missing share_count
      createdAt: post.created_at || post.published_at, // Use published_at as fallback
      updatedAt: post.updated_at
    };
  },
  /**
   * Maps a database post to a frontend post
   * @param post The database post to map
   * @returns The mapped frontend post
   */
  mapPostToFrontend(post: any): NewsletterPost {
    return {
      id: post.id,
      title: post.title || '', // Add fallback for missing title
      content: post.content,
      authorId: post.author_id,
      userId: post.user_id || post.author_id, // Use author_id as fallback for missing user_id
      isPublished: post.is_published,
      publishedAt: post.published_at,
      // Cast media_type to the correct type or default to 'none'
      mediaType: (post.media_type as "none" | "image" | "video" | "audio") || 'none',
      mediaUrl: post.media_url || null,
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0, // Add fallback for missing like_count
      shareCount: post.share_count || 0, // Add fallback for missing share_count
      createdAt: post.created_at || post.published_at, // Use published_at as fallback
      updatedAt: post.updated_at
    };
  },
  /**
   * Maps a database post to a frontend post
   * @param post The database post to map
   * @returns The mapped frontend post
   */
  mapPostToFrontend(post: any): NewsletterPost {
    return {
      id: post.id,
      title: post.title || '', // Add fallback for missing title
      content: post.content,
      authorId: post.author_id,
      userId: post.user_id || post.author_id, // Use author_id as fallback for missing user_id
      isPublished: post.is_published,
      publishedAt: post.published_at,
      // Cast media_type to the correct type or default to 'none'
      mediaType: (post.media_type as "none" | "image" | "video" | "audio") || 'none',
      mediaUrl: post.media_url || null,
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0, // Add fallback for missing like_count
      shareCount: post.share_count || 0, // Add fallback for missing share_count
      createdAt: post.created_at || post.published_at, // Use published_at as fallback
      updatedAt: post.updated_at
    };
  },
};
