
import React from 'react';
import { PostWithStats } from '@/types/newsletter';
import { NewsletterPost } from '@/components/newsletter/NewsletterPost';
import PostDetailSkeleton from '@/components/newsletter/PostDetailSkeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { newsletterService } from '@/services/newsletterService';

interface PostDetailContentProps {
  postId: string | undefined;
  post: PostWithStats | null;
  isLoading: boolean;
}

const PostDetailContent: React.FC<PostDetailContentProps> = ({ 
  postId, 
  post, 
  isLoading 
}) => {
  const navigate = useNavigate();
  
  const handleDeletePost = async (postId: string) => {
    try {
      const success = await newsletterService.deletePost(postId);
      if (success) {
        toast.success('Publicação excluída com sucesso');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
    }
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }
  
  if (!post) {
    return (
      <div className="text-center p-8 text-white/60">
        <p>Publicação não encontrada</p>
      </div>
    );
  }
  
  return (
    <NewsletterPost 
      post={post}
      onDelete={handleDeletePost}
    />
  );
};

export default PostDetailContent;
