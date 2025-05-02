
import { supabase } from '@/integrations/supabase/client';
import { PostWithStats, Comment, NewsletterServiceType, AdminNewsletterServiceType } from '@/types/newsletter';

// Newsletter service for regular users
export const newsletterService: NewsletterServiceType = {
  // Get all published posts
  async getPosts() {
    try {
      const { data: posts, error } = await supabase
        .from('newsletter_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the PostWithStats interface
      const postsWithStats = (posts || []).map(post => ({
        ...post,
        likes_count: post.like_count || 0,
        comments_count: 0, // We'll need to fetch this separately
        user_has_liked: false // Default value
      })) as PostWithStats[];

      // You might want to fetch likes and comments counts here
      return postsWithStats;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  // Get a post by ID
  async getPostById(id: string) {
    try {
      const { data: post, error } = await supabase
        .from('newsletter_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!post) {
        throw new Error(`Post with ID ${id} not found`);
      }

      // Transform the post to match the PostWithStats interface
      const postWithStats = {
        ...post,
        likes_count: post.like_count || 0,
        comments_count: 0, // We'll need to fetch this separately
        user_has_liked: false // Default value
      } as PostWithStats;

      return postWithStats;
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      throw error;
    }
  },

  // Like or unlike a post
  async likePost(postId: string) {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if the user has already liked the post
      const { data: existingLike, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (likeCheckError && likeCheckError.code !== 'PGRST116') {
        // PGRST116 is "row not found" which is expected if user hasn't liked
        throw likeCheckError;
      }

      if (existingLike) {
        // User has already liked the post, so unlike it
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;

        // Decrement the like count
        const { error: updateError } = await supabase.rpc('decrement_counter', {
          table_name: 'newsletter_posts',
          column_name: 'like_count',
          row_id: postId
        });

        if (updateError) throw updateError;

        return false; // Return false to indicate the post is now unliked
      } else {
        // User hasn't liked the post yet, so like it
        const { error: likeError } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (likeError) throw likeError;

        // Increment the like count
        const { error: updateError } = await supabase.rpc('increment_counter', {
          table_name: 'newsletter_posts',
          column_name: 'like_count',
          row_id: postId
        });

        if (updateError) throw updateError;

        return true; // Return true to indicate the post is now liked
      }
    } catch (error) {
      console.error(`Error toggling like for post ${postId}:`, error);
      return false;
    }
  },
  
  // Get comments for a post
  async getComments(postId: string) {
    try {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return comments as Comment[];
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  },

  // Add a comment to a post
  async addComment(postId: string, content: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ post_id: postId, user_id: user.id, content }])
        .select(`
          *,
          author:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return data as Comment;
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      return false;
    }
  },

  // Increment view count for a post
  async incrementViewCount(postId: string) {
    try {
      const { error } = await supabase.rpc('increment_counter', {
        table_name: 'newsletter_posts',
        column_name: 'view_count',
        row_id: postId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error incrementing view count for post ${postId}:`, error);
      return false;
    }
  }
};

// Newsletter service for admin users with additional capabilities
export const newsletterAdminService: AdminNewsletterServiceType = {
  // Get all posts (published and unpublished)
  async getAllPosts() {
    try {
      const { data: posts, error } = await supabase
        .from('newsletter_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the PostWithStats interface
      const postsWithStats = (posts || []).map(post => ({
        ...post,
        likes_count: post.like_count || 0,
        comments_count: 0, // We'll fetch this separately if needed
        user_has_liked: false // Default value for admin view
      })) as PostWithStats[];

      return postsWithStats;
    } catch (error) {
      console.error('Error fetching all posts:', error);
      return [];
    }
  },

  // Create a new post
  async createPost(postData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prepare the data with the correct field names for the database
      const dbPostData = {
        title: postData.title,
        content: postData.content,
        media_url: postData.mediaUrl || null,
        media_type: postData.mediaType || null,
        is_published: postData.isPublished !== undefined ? postData.isPublished : true,
        user_id: user.id,
        author_id: user.id,
        published_at: postData.isPublished !== false ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('newsletter_posts')
        .insert([dbPostData])
        .select()
        .single();

      if (error) throw error;

      // Transform to match PostWithStats
      return {
        ...data,
        likes_count: 0,
        comments_count: 0,
        user_has_liked: false,
        like_count: 0,
        view_count: 0,
        share_count: 0
      } as PostWithStats;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update an existing post
  async updatePost(postId, postData) {
    try {
      // Prepare the data with the correct field names for the database
      const dbPostData = {
        ...(postData.title !== undefined && { title: postData.title }),
        ...(postData.content !== undefined && { content: postData.content }),
        ...(postData.media_url !== undefined && { media_url: postData.media_url }),
        ...(postData.media_type !== undefined && { media_type: postData.media_type }),
        ...(postData.is_published !== undefined && { 
          is_published: postData.is_published,
          published_at: postData.is_published ? new Date().toISOString() : null
        })
      };

      const { data, error } = await supabase
        .from('newsletter_posts')
        .update(dbPostData)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      // Transform to match PostWithStats
      return {
        ...data,
        likes_count: data.like_count || 0,
        comments_count: 0, // We'd need to fetch this separately
        user_has_liked: false // Default for admin view
      } as PostWithStats;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  },

  // Delete a post
  async deletePost(postId) {
    try {
      // First delete all comments for the post
      const { error: commentsError } = await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', postId);

      if (commentsError) throw commentsError;

      // Then delete all likes for the post
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);

      if (likesError) throw likesError;

      // Finally delete the post itself
      const { error } = await supabase
        .from('newsletter_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      return false;
    }
  }
};
