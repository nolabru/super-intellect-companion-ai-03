import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { PostWithCounts, CommentWithUser, PostFilterParams } from '@/types/newsletter';
import { mapPostToFrontend } from './utils';

/**
 * Busca posts para a página inicial da newsletter
 * @param params Parâmetros de filtragem
 * @returns Array de posts com contagens de engajamento
 */
export const queryPosts = async ({
  limit = 10,
  offset = 0,
  onlyPublished = true,
  authorId = null,
  sortBy = 'published_at',
  sortDirection = 'desc'
}: PostFilterParams): Promise<{
  posts: PostWithCounts[];
  count: number;
  error: PostgrestError | null;
}> => {
  try {
    // Montar query base
    let query = supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact' });
    
    // Adicionar filtros
    if (onlyPublished) {
      query = query.eq('is_published', true);
    }
    
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    
    // Adicionar ordenação e paginação
    query = query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data, count, error } = await query;
    
    // Map the database results to frontend posts
    const posts: PostWithCounts[] = (data || []).map(post => mapPostToFrontend(post));
    
    return {
      posts,
      count: count || 0,
      error
    };
  } catch (err) {
    console.error('Erro ao consultar posts:', err);
    return {
      posts: [],
      count: 0,
      error: err as PostgrestError
    };
  }
};

/**
 * Busca um post específico pelo ID
 * @param postId ID do post
 * @returns Post com contagens de engajamento
 */
export const queryPostById = async (postId: string): Promise<{
  post: PostWithCounts | null;
  error: PostgrestError | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Map the database result to frontend post
    const post = mapPostToFrontend(data);
    
    return {
      post,
      error: null
    };
  } catch (err) {
    console.error('Erro ao buscar post por ID:', err);
    return {
      post: null,
      error: err as PostgrestError
    };
  }
};

/**
 * Busca comentários de um post
 * @param postId ID do post
 * @param limit Limite de comentários
 * @param offset Offset para paginação
 * @returns Array de comentários com dados dos usuários
 */
export const queryCommentsByPostId = async (
  postId: string,
  limit = 10,
  offset = 0
): Promise<{
  comments: CommentWithUser[];
  count: number;
  error: PostgrestError | null;
}> => {
  try {
    const { data, count, error } = await supabase
      .from('post_comments')
      .select('*, profiles!post_comments_user_id_fkey(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    const comments: CommentWithUser[] = (data || []).map(item => {
      const profile = item.profiles || {};
      return {
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Handle potentially missing profile data with defaults
        username: profile.username || 'Usuário',
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        user: {
          username: profile.username || 'Usuário',
          avatar_url: profile.avatar_url || null
        }
      };
    });
    
    return {
      comments,
      count: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Erro ao buscar comentários:', err);
    return {
      comments: [],
      count: 0,
      error: err as PostgrestError
    };
  }
};

/**
 * Implementação das funções faltantes exportadas em index.ts
 */

export const getPosts = async (params = {}) => {
  const result = await queryPosts({ ...params });
  return {
    data: result.posts,
    count: result.count,
    error: result.error
  };
};

export const getPublishedPosts = async (params = {}) => {
  return getPosts({ ...params, onlyPublished: true });
};

export const getPostsByUserId = async (userId: string, params = {}) => {
  return getPosts({ ...params, authorId: userId });
};

export const getPublishedPostsByUserId = async (userId: string, params = {}) => {
  return getPosts({ ...params, authorId: userId, onlyPublished: true });
};

export const getPostsBySearchTerm = async (searchTerm: string, params = {}) => {
  // Implementação simples de busca
  const result = await getPosts({ ...params });
  const filteredPosts = result.data.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.summary && post.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  return {
    data: filteredPosts,
    count: filteredPosts.length,
    error: null
  };
};

export const getPostsByCategory = async (category: string, params = {}) => {
  // Implementação simples para categorias
  // Supondo que temos uma propriedade de categoria nos posts ou uma tabela relacionada
  return getPosts(params);
};

export const getPopularPosts = async (params = {}) => {
  return getPosts({ ...params, sortBy: 'view_count', sortDirection: 'desc' });
};

export const getRelatedPosts = async (postId: string, limit = 3) => {
  // Implementação simples: pegar os posts mais recentes como relacionados
  const result = await getPosts({ limit, sortBy: 'published_at', sortDirection: 'desc' });
  // Filtrar o post atual
  const filteredPosts = result.data.filter(post => post.id !== postId);
  return {
    data: filteredPosts.slice(0, limit),
    count: filteredPosts.length,
    error: null
  };
};

/**
 * Publica um comentário em um post
 * @param postId ID do post
 * @param content Conteúdo do comentário
 * @param userId ID do usuário autor
 * @returns Dados do comentário criado
 */
export const publishComment = async (
  postId: string,
  content: string,
  userId: string
): Promise<{
  comment: CommentWithUser | null;
  error: PostgrestError | null;
}> => {
  try {
    // Verificar se o post existe
    const { data: post, error: postError } = await supabase
      .from('newsletter_posts')
      .select('id')
      .eq('id', postId)
      .single();
    
    if (postError) {
      throw new Error('Post não encontrado');
    }
    
    // Criar comentário
    const { data, error } = await supabase
      .from('post_comments')
      .insert([
        {
          post_id: postId,
          user_id: userId,
          content
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('Erro ao criar comentário');
    }
    
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.warn('Erro ao buscar dados do usuário:', userError);
    }
    
    // Retornar comentário com dados do usuário
    const comment: CommentWithUser = {
      ...data,
      username: userData?.username || 'Usuário',
      display_name: null, // Profiles não tem display_name
      avatar_url: userData?.avatar_url || null,
      user: {
        username: userData?.username || 'Usuário',
        avatar_url: userData?.avatar_url || null
      }
    };
    
    return { comment, error: null };
  } catch (err) {
    console.error('Erro ao publicar comentário:', err);
    return {
      comment: null,
      error: err as PostgrestError
    };
  }
};
