
import { useState, useEffect } from 'react';
import { PostWithStats, CommentWithUser } from '@/types/newsletter';
import { newsletterService } from '@/services/newsletterService';
import { toast } from 'sonner';

export const usePostDetail = (postId: string | undefined) => {
  const [post, setPost] = useState<PostWithStats | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setIsLoadingPost(true);
      const postData = await newsletterService.getPostById(postId);
      setPost(postData);
      
      // Increment view count
      await newsletterService.incrementViewCount(postId);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Erro ao carregar publicação');
    } finally {
      setIsLoadingPost(false);
    }
  };
  
  const fetchComments = async () => {
    if (!postId) return;
    
    try {
      setIsLoadingComments(true);
      const commentsData = await newsletterService.getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const refreshData = async () => {
    await Promise.all([fetchPost(), fetchComments()]);
  };
  
  useEffect(() => {
    refreshData();
  }, [postId]);
  
  const updatePost = (updatedPost: PostWithStats) => {
    setPost(updatedPost);
  };
  
  return {
    post,
    comments,
    isLoadingPost,
    isLoadingComments,
    refreshData,
    fetchComments,
    updatePost
  };
};

export default usePostDetail;
