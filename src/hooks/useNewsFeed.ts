
import { useState, useEffect } from 'react';
import { PostWithStats } from '@/types/newsletter';
import { queryService } from '@/services/newsletter/query';
import { newsletterService } from '@/services/newsletterService';
import { toast } from 'sonner';

export const useNewsFeed = () => {
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const result = await queryService.getPosts();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setPosts(result.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erro ao carregar publicações');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    try {
      const success = await newsletterService.deletePost(postId);
      if (success) {
        setPosts(posts.filter(post => post.id !== postId));
        toast.success('Publicação excluída com sucesso');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
    }
  };
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  return {
    posts,
    isLoading,
    handleDeletePost,
    refreshPosts: fetchPosts
  };
};
