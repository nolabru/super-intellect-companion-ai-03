
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { PostWithCounts, PostFilterParams } from '@/types/newsletter';
import { mapPostToFrontend } from '../utils';
import { PostsQueryResult, PostQueryResult } from './types';

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
}: PostFilterParams): Promise<PostsQueryResult> => {
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
export const queryPostById = async (postId: string): Promise<PostQueryResult> => {
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
    const post = data ? mapPostToFrontend(data) : null;
    
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
 * Busca posts publicados com filtros
 */
export const getPublishedPosts = async (params = {}) => {
  return queryPosts({ ...params, onlyPublished: true });
};

/**
 * Busca posts por ID de usuário
 */
export const getPostsByUserId = async (userId: string, params = {}) => {
  return queryPosts({ ...params, authorId: userId });
};

/**
 * Busca posts publicados por ID de usuário
 */
export const getPublishedPostsByUserId = async (userId: string, params = {}) => {
  return queryPosts({ ...params, authorId: userId, onlyPublished: true });
};

/**
 * Busca posts mais populares
 */
export const getPopularPosts = async (params = {}) => {
  return queryPosts({ ...params, sortBy: 'view_count', sortDirection: 'desc' });
};

/**
 * Busca posts por termo de busca
 */
export const getPostsBySearchTerm = async (searchTerm: string, params = {}) => {
  // Implementação simples de busca no cliente
  const result = await queryPosts({ ...params });
  const filteredPosts = result.posts.filter(post => 
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

/**
 * Busca posts por categoria
 */
export const getPostsByCategory = async (category: string, params = {}) => {
  // Implementação simples para categorias
  // Supondo que temos uma propriedade de categoria nos posts ou uma tabela relacionada
  return queryPosts(params);
};

/**
 * Busca posts relacionados a um post específico
 */
export const getRelatedPosts = async (postId: string, limit = 3) => {
  // Implementação simples: pegar os posts mais recentes como relacionados
  const result = await queryPosts({ limit, sortBy: 'published_at', sortDirection: 'desc' });
  // Filtrar o post atual
  const filteredPosts = result.posts.filter(post => post.id !== postId);
  return {
    data: filteredPosts.slice(0, limit),
    count: filteredPosts.length,
    error: null
  };
};

/**
 * Implementação das funções wrapper para compatibilidade com código existente
 */
export const getPosts = async (params = {}) => {
  const result = await queryPosts({ ...params });
  return {
    data: result.posts,
    count: result.count,
    error: result.error
  };
};
