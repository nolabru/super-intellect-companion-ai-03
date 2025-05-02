
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface para post de newsletter
export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  media_url?: string;
  media_type?: string;
  is_published: boolean;
}

// Interface estendida com estatísticas
export interface PostWithStats extends Post {
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

// Serviço para usuários regulares
export const newsletterService = {
  // Buscar todos os posts publicados (incluindo posts de admin)
  async getPosts(): Promise<PostWithStats[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      // Buscar todos os posts publicados, incluindo posts de admin
      const { data, error } = await supabase
        .from('newsletter_posts')
        .select(`
          *,
          like_count,
          share_count,
          view_count,
          post_likes!inner(id, user_id, post_id)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar posts:', error);
        throw error;
      }
      
      // Mapear dados para formato esperado pela UI
      const posts: PostWithStats[] = (data || []).map(post => ({
        ...post,
        likes_count: post.like_count || 0,
        comments_count: 0, // Temporário até implementar contagem de comentários
        user_has_liked: currentUserId 
          ? post.post_likes && post.post_likes.some((like: any) => like.user_id === currentUserId)
          : false
      }));
      
      return posts;
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      throw error;
    }
  },
  
  // Buscar um post específico
  async getPostById(id: string): Promise<PostWithStats | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_posts')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();
      
      if (error || !data) {
        console.error('Erro ao buscar post:', error);
        return null;
      }
      
      // Incrementar contagem de visualizações
      const { data: updateData, error: updateError } = await supabase.rpc(
        'increment_counter',
        { row_id: data.id, increment_amount: 1 }
      );
      
      if (updateError) {
        console.error('Erro ao incrementar visualizações:', updateError);
      }
      
      // Buscar estatísticas adicionais
      const { data: likeData, error: likeError } = await supabase
        .from('post_likes')
        .select('count')
        .eq('post_id', id);
      
      if (likeError) {
        console.error('Erro ao buscar curtidas:', likeError);
      }
      
      // Verificar se o usuário atual curtiu o post
      const { data: userData } = await supabase.auth.getUser();
      let userHasLiked = false;
      
      if (userData?.user) {
        const { data: userLikeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', userData.user.id)
          .maybeSingle();
        
        userHasLiked = !!userLikeData;
      }
      
      return {
        ...data,
        likes_count: data.like_count || 0,
        comments_count: 0, // Temporário até implementar contagem de comentários
        user_has_liked: userHasLiked
      };
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      return null;
    }
  },
  
  // Curtir um post
  async likePost(postId: string): Promise<boolean> {
    try {
      // Verificar se o usuário está autenticado
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        toast.error('Você precisa estar logado para curtir um post');
        return false;
      }
      
      // Verificar se o usuário já curtiu este post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (existingLike) {
        // Usuário já curtiu, então remover curtida
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        
        if (deleteError) {
          console.error('Erro ao remover curtida:', deleteError);
          throw deleteError;
        }
        
        // Decrementar contador de curtidas
        const { error: updateError } = await supabase
          .from('newsletter_posts')
          .update({ like_count: supabase.rpc('decrement', { row_id: postId }) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('Erro ao atualizar contador de curtidas:', updateError);
        }
        
        return true;
      } else {
        // Adicionar nova curtida
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userData.user.id
          });
        
        if (insertError) {
          console.error('Erro ao adicionar curtida:', insertError);
          throw insertError;
        }
        
        // Incrementar contador de curtidas
        const { error: updateError } = await supabase
          .from('newsletter_posts')
          .update({ like_count: supabase.rpc('increment', { row_id: postId }) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('Erro ao atualizar contador de curtidas:', updateError);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao processar curtida:', error);
      return false;
    }
  }
};

// Serviço administrativo com funcionalidades adicionais
export const newsletterAdminService = {
  // Buscar todos os posts (incluindo não publicados)
  async getAllPosts(): Promise<PostWithStats[]> {
    try {
      // Verificar se o usuário é admin
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      // Consulta para todos os posts
      const { data, error } = await supabase
        .from('newsletter_posts')
        .select(`
          *,
          like_count,
          share_count,
          view_count
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar posts admin:', error);
        throw error;
      }
      
      // Mapear dados para formato esperado pela UI
      const posts: PostWithStats[] = (data || []).map(post => ({
        ...post,
        likes_count: post.like_count || 0,
        comments_count: 0, // Temporário até implementar contagem de comentários
        user_has_liked: false
      }));
      
      return posts;
    } catch (error) {
      console.error('Erro ao buscar posts admin:', error);
      throw error;
    }
  },
  
  // Criar novo post
  async createPost(postData: {
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    isPublished?: boolean;
  }): Promise<Post | null> {
    try {
      // Obter usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Usuário não autenticado');
      }
      
      // Inserir novo post
      const { data, error } = await supabase
        .from('newsletter_posts')
        .insert({
          title: postData.title,
          content: postData.content,
          media_url: postData.mediaUrl,
          media_type: postData.mediaType,
          is_published: postData.isPublished !== undefined ? postData.isPublished : true,
          author_id: userData.user.id,
          user_id: userData.user.id // Garantir que o post tenha um user_id para políticas RLS
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar post:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      return null;
    }
  },
  
  // Atualizar post existente
  async updatePost(id: string, postData: {
    title?: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    isPublished?: boolean;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newsletter_posts')
        .update({
          title: postData.title,
          content: postData.content,
          media_url: postData.mediaUrl,
          media_type: postData.mediaType,
          is_published: postData.isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar post:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      return false;
    }
  },
  
  // Excluir post
  async deletePost(id: string): Promise<boolean> {
    try {
      // Primeiro excluir relacionamentos
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id);
      
      if (likesError) {
        console.error('Erro ao excluir curtidas do post:', likesError);
      }
      
      const { error: commentsError } = await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', id);
      
      if (commentsError) {
        console.error('Erro ao excluir comentários do post:', commentsError);
      }
      
      // Então excluir o post
      const { error } = await supabase
        .from('newsletter_posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir post:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      return false;
    }
  }
};
