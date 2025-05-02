import { supabase } from '@/integrations/supabase/client';
import { NewsletterPost, PostWithStats, CommentWithUser } from '@/types/newsletter';
import { toast } from 'sonner';

export const newsletterService = {
  async getPosts(): Promise<PostWithStats[]> {
    const { data: posts, error } = await supabase
      .from('newsletter_posts')
      .select(`
        *,
        post_likes(count),
        post_comments(count)
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    // Get the user ID to check if the current user has liked each post
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // For each post, check if the current user has liked it
    const postsWithLikes = await Promise.all(posts.map(async (post: any) => {
      const likesCount = post.post_likes.length > 0 ? parseInt(post.post_likes[0].count) : 0;
      const commentsCount = post.post_comments.length > 0 ? parseInt(post.post_comments[0].count) : 0;
      
      let userHasLiked = false;
      
      if (userId) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .single();
        
        userHasLiked = !!likes;
      }

      // Get author information
      const { data: author } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', post.author_id)
        .single();
      
      // Create a complete PostWithStats object with all required fields
      const enhancedPost: PostWithStats = {
        id: post.id,
        title: post.title || '',  // Provide default values for required fields
        content: post.content,
        user_id: post.user_id || post.author_id,  // Use author_id as fallback
        published_at: post.published_at,
        media_url: post.media_url,
        media_type: post.media_type,
        view_count: post.view_count,
        like_count: likesCount,
        share_count: post.share_count || 0,  // Default to 0 if missing
        created_at: post.created_at,
        updated_at: post.updated_at,
        is_published: post.is_published,
        author_id: post.author_id,
        likes_count: likesCount,
        comments_count: commentsCount,
        user_has_liked: userHasLiked,
        author
      };
      
      return enhancedPost;
    }));

    return postsWithLikes;
  },

  async getPostById(postId: string): Promise<PostWithStats | null> {
    const { data: post, error } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    // Get likes count
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('count')
      .eq('post_id', postId);

    const likesCount = likesData?.length || 0;

    // Get comments count
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('count')
      .eq('post_id', postId);

    const commentsCount = commentsData?.length || 0;

    // Get author information
    const { data: author } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', post.author_id)
      .single();

    // Check if current user has liked the post
    const { data: { user } } = await supabase.auth.getUser();
    let userHasLiked = false;

    if (user) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      userHasLiked = !!likeData;
    }

    // Create a complete PostWithStats object with all required fields
    const enhancedPost: PostWithStats = {
      id: post.id,
      title: post.title || '',
      content: post.content,
      user_id: post.user_id || post.author_id,
      published_at: post.published_at,
      media_url: post.media_url,
      media_type: post.media_type,
      view_count: post.view_count,
      like_count: likesCount,
      share_count: post.share_count || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      is_published: post.is_published,
      author_id: post.author_id,
      likes_count: likesCount,
      comments_count: commentsCount,
      user_has_liked: userHasLiked,
      author
    };

    return enhancedPost;
  },

  async likePost(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para curtir uma publicação');
      return false;
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike if already liked
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unliking post:', error);
        toast.error('Erro ao remover curtida');
        return false;
      }

      return false;
    } else {
      // Like if not already liked
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        console.error('Error liking post:', error);
        toast.error('Erro ao curtir publicação');
        return false;
      }

      return true;
    }
  },

  async addComment(postId: string, content: string): Promise<CommentWithUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return null;
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert([{ post_id: postId, user_id: user.id, content }])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
      return null;
    }

    // Get user profile information
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      user: profile
    };
  },

  async getComments(postId: string): Promise<CommentWithUser[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Get user information for each comment
    const commentsWithUsers = await Promise.all(data.map(async (comment) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', comment.user_id)
        .single();

      return {
        ...comment,
        user: profile
      };
    }));

    return commentsWithUsers;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para excluir um comentário');
      return false;
    }

    // Check if the user is the comment owner or an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin;

    if (!isAdmin) {
      // If not admin, verify if the comment belongs to the user
      const { data: comment } = await supabase
        .from('post_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== user.id) {
        toast.error('Você não tem permissão para excluir este comentário');
        return false;
      }
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
      return false;
    }

    return true;
  },

  // Add method to increment view count
  async incrementViewCount(postId: string): Promise<void> {
    try {
      await fetch(`https://vygluorjwehcdigzxbaa.supabase.co/functions/v1/increment-post-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`
        },
        body: JSON.stringify({ post_id: postId })
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }
};

// Admin-only operations
export const newsletterAdminService = {
  async createPost(post: Partial<NewsletterPost>): Promise<NewsletterPost | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para criar uma publicação');
      return null;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error('Apenas administradores podem criar publicações');
      return null;
    }

    // Ensure required fields are not undefined
    if (!post.title) {
      toast.error('O título não pode estar vazio');
      return null;
    }
    
    if (!post.content) {
      toast.error('O conteúdo não pode estar vazio');
      return null;
    }

    // Set both author_id and user_id to ensure RLS policy works properly
    const { data, error } = await supabase
      .from('newsletter_posts')
      .insert({
        ...post,
        author_id: user.id,
        user_id: user.id, // Important: Set this to match the RLS policy
        title: post.title,
        content: post.content,
        like_count: 0,
        share_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      toast.error('Erro ao criar publicação: ' + error.message);
      return null;
    }

    // Create a complete NewsletterPost object with all required fields
    const completePost: NewsletterPost = {
      id: data.id,
      title: data.title,
      content: data.content,
      user_id: data.user_id,
      published_at: data.published_at,
      media_url: data.media_url,
      media_type: data.media_type,
      view_count: data.view_count,
      like_count: data.like_count || 0,
      share_count: data.share_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_published: data.is_published,
      author_id: data.author_id,
    };

    toast.success('Publicação criada com sucesso');
    return completePost;
  },

  async updatePost(postId: string, updates: Partial<NewsletterPost>): Promise<NewsletterPost | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para editar uma publicação');
      return null;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error('Apenas administradores podem editar publicações');
      return null;
    }

    const { data, error } = await supabase
      .from('newsletter_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      toast.error('Erro ao atualizar publicação');
      return null;
    }

    // Create a complete NewsletterPost object with all required fields
    const completePost: NewsletterPost = {
      id: data.id,
      title: data.title,
      content: data.content,
      user_id: data.user_id,
      published_at: data.published_at,
      media_url: data.media_url,
      media_type: data.media_type,
      view_count: data.view_count,
      like_count: data.like_count || 0,
      share_count: data.share_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_published: data.is_published,
      author_id: data.author_id,
    };

    toast.success('Publicação atualizada com sucesso');
    return completePost;
  },

  async deletePost(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Você precisa estar logado para excluir uma publicação');
      return false;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error('Apenas administradores podem excluir publicações');
      return false;
    }

    const { error } = await supabase
      .from('newsletter_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
      return false;
    }

    toast.success('Publicação excluída com sucesso');
    return true;
  }
};
