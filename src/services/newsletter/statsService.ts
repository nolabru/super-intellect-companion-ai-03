
import { supabase } from '@/integrations/supabase/client';
import { PostWithCounts } from '@/types/newsletter';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Obtém estatísticas gerais do sistema de newsletter
 */
export const getStats = async () => {
  try {
    // Obter contagem de posts
    const { count: postCount, error: postsError } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true });
    
    // Obter contagem de posts publicados
    const { count: publishedPostCount, error: publishedError } = await supabase
      .from('newsletter_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);
    
    // Obter contagem de comentários
    const { count: commentCount, error: commentsError } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true });
    
    // Obter contagem de curtidas
    const { count: likeCount, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true });
    
    if (postsError || publishedError || commentsError || likesError) {
      console.error('Erro ao obter estatísticas:', { 
        postsError, publishedError, commentsError, likesError 
      });
      return null;
    }
    
    return {
      totalPosts: postCount || 0,
      publishedPosts: publishedPostCount || 0,
      totalComments: commentCount || 0,
      totalLikes: likeCount || 0
    };
  } catch (err) {
    console.error('Erro ao obter estatísticas:', err);
    return null;
  }
};

/**
 * Obtém os posts mais populares por visualizações
 * @param limit Limite de posts a retornar
 */
export const getTopPosts = async (limit = 5): Promise<{
  data: PostWithCounts[];
  error: PostgrestError | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return {
      data: data as PostWithCounts[],
      error: null
    };
  } catch (err) {
    console.error('Erro ao obter posts principais:', err);
    return {
      data: [],
      error: err as PostgrestError
    };
  }
};

/**
 * Obtém estatísticas de engajamento para um período específico
 * @param days Número de dias para considerar
 */
export const getEngagementStats = async (days = 30) => {
  try {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    
    const startDateISO = startDate.toISOString();
    
    // Obter visualizações no período
    const { data: viewData, error: viewError } = await supabase
      .from('newsletter_posts')
      .select('view_count')
      .gte('updated_at', startDateISO);
    
    // Obter curtidas no período
    const { data: likesData, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact' })
      .gte('created_at', startDateISO);
    
    // Obter comentários no período
    const { data: commentsData, error: commentsError } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact' })
      .gte('created_at', startDateISO);
    
    if (viewError || likesError || commentsError) {
      console.error('Erro ao obter estatísticas de engajamento:', { 
        viewError, likesError, commentsError 
      });
      return null;
    }
    
    // Calcular visualizações totais
    const totalViews = viewData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
    
    return {
      period: `${days} dias`,
      totalViews,
      totalLikes: likesData?.length || 0,
      totalComments: commentsData?.length || 0,
      engagementRate: viewData && viewData.length > 0 
        ? ((likesData?.length || 0) + (commentsData?.length || 0)) / totalViews 
        : 0
    };
  } catch (err) {
    console.error('Erro ao obter estatísticas de engajamento:', err);
    return null;
  }
};
