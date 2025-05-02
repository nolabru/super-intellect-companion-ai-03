
import { supabase } from '@/integrations/supabase/client';
import { NewsletterPost, PostWithStats, CommentWithUser } from '@/types/newsletter';
import { PostgrestError } from '@supabase/supabase-js';

interface PaginatedPosts {
  data: PostWithStats[];
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
  async getPostById(id: string): Promise<PostWithStats | null> {
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

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
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

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
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
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        console.error('Error fetching posts by user:', error);
        return { data: [], totalCount: 0 };
      }

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
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
        .eq('author_id', userId)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        console.error('Error fetching published posts by user:', error);
        return { data: [], totalCount: 0 };
      }

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
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
  },

  /**
   * Increments the view count for a post
   * @param postId The ID of the post to increment the view count for
   * @returns A promise that resolves when the view count has been incremented
   */
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
  
  /**
   * Increments the like count for a post
   * @param postId The ID of the post to increment the like count for
   * @returns A promise that resolves when the like count has been incremented
   */
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
  
  /**
   * Increments the share count for a post
   * @param postId The ID of the post to increment the share count for
   * @returns A promise that resolves when the share count has been incremented
   */
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
  
  /**
   * Gets popular posts ordered by view count
   * @param limit The maximum number of posts to return
   * @returns A list of popular posts
   */
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

      return data ? data.map(post => this.mapPostToFrontend(post)) as NewsletterPost[] : [];
    } catch (err) {
      console.error('Error fetching popular posts:', err);
      return [];
    }
  },
  
  /**
   * Gets recent posts ordered by published date
   * @param limit The maximum number of posts to return
   * @returns A list of recent posts
   */
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

      return data ? data.map(post => this.mapPostToFrontend(post)) as NewsletterPost[] : [];
    } catch (err) {
      console.error('Error fetching recent posts:', err);
      return [];
    }
  },
  
  /**
   * Gets posts by search term
   * @param searchTerm The search term to filter posts by
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
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

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
    } catch (err) {
      console.error('Error fetching posts by search term:', err);
      return { data: [], totalCount: 0 };
    }
  },
  
  /**
   * Gets the total number of posts by search term
   * @param searchTerm The search term to filter posts by
   * @returns The total number of posts matching the search term
   */
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
  
  /**
   * Gets posts by category
   * @param category The category to filter posts by
   * @param page The page number to get
   * @param pageSize The number of posts per page
   * @returns An object containing the posts and the total count
   */
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

      const posts = data ? data.map(post => this.mapPostToFrontend(post)) : [];
      const totalCount = count || 0;

      return { data: posts as PostWithStats[], totalCount };
    } catch (err) {
      console.error('Error fetching posts by category:', err);
      return { data: [], totalCount: 0 };
    }
  },
  
  /**
   * Gets the total number of posts by category
   * @param category The category to filter posts by
   * @returns The total number of posts in the category
   */
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

  // Add comment-related methods
  async addComment(postId: string, content: string): Promise<CommentWithUser | null> {
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
      const userInfo = await this.getUserInfo(userId);
      
      return {
        ...data,
        user: userInfo
      };
    } catch (err) {
      console.error('Error adding comment:', err);
      return null;
    }
  },
  
  async getComments(postId: string): Promise<CommentWithUser[]> {
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
        const userInfo = await this.getUserInfo(comment.user_id);
        commentsWithUsers.push({
          ...comment,
          user: userInfo
        });
      }

      return commentsWithUsers;
    } catch (err) {
      console.error('Error fetching comments:', err);
      return [];
    }
  },
  
  async deleteComment(commentId: string): Promise<boolean> {
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
  },
  
  // Helper methods
  async getUserInfo(userId: string): Promise<{ username?: string; avatar_url?: string }> {
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
  },
  
  /**
   * Maps a database post to a frontend post
   * @param post The database post to map
   * @returns The mapped frontend post
   */
  mapPostToFrontend(post: any): PostWithStats {
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
  }
};

// Export the newsletter admin service that contains the same methods
export const newsletterAdminService = newsletterService;
