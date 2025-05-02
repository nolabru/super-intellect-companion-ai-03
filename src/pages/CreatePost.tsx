
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import PostForm from '@/components/newsletter/PostForm';
import { newsletterAdminService } from '@/services/newsletterService';
import { NewsletterPost } from '@/types/newsletter';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: checkingAdmin } = useAdminCheck();

  const handleCreatePost = async (postData: Partial<NewsletterPost>) => {
    try {
      // Make sure title and content are defined
      if (!postData.title || !postData.content) {
        toast.error('Título e conteúdo são obrigatórios');
        return;
      }
      
      const newPost = await newsletterAdminService.createPost({
        title: postData.title,
        content: postData.content,
        mediaUrl: postData.media_url || undefined,
        mediaType: postData.media_type || undefined,
        isPublished: postData.is_published
      });
      
      if (newPost) {
        toast.success('Publicação criada com sucesso!');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Erro ao criar publicação. Tente novamente.');
    }
  };

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-inventu-darker">
        <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-inventu-darker">
      <AppHeader 
        sidebarOpen={false} 
        onToggleSidebar={() => {}} 
        title="Nova Publicação" 
      />
      
      <main className="flex-1 overflow-hidden p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Criar Nova Publicação</h1>
            <Button 
              variant="outline" 
              className="border-white/20 text-white/70 hover:bg-inventu-dark/50 hover:text-white"
              onClick={() => navigate('/feed')}
            >
              Voltar
            </Button>
          </div>
          
          <PostForm 
            onSubmit={handleCreatePost} 
            submitLabel="Publicar" 
            title="Nova Publicação"
          />
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
