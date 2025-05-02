
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostForm from '@/components/newsletter/PostForm';
import { newsletterAdminService, newsletterService } from '@/services/newsletterService';
import { PostWithStats } from '@/types/newsletter';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { NewsletterPost } from '@/components/newsletter/NewsletterPost';
import { cn } from '@/lib/utils';

const AdminPostsManagement: React.FC = () => {
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        // Usar método específico para admin para garantir que todos os posts sejam carregados
        const postsData = await newsletterAdminService.getAllPosts();
        setPosts(postsData);
      } catch (error) {
        console.error('Erro ao carregar publicações:', error);
        toast.error('Erro ao carregar publicações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);
  
  const handleCreatePost = async (postData: any) => {
    try {
      const newPost = await newsletterAdminService.createPost(postData);
      if (newPost) {
        // Add necessary fields to match PostWithStats type
        const enhancedPost: PostWithStats = {
          ...newPost,
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false
        };
        setPosts(prev => [enhancedPost, ...prev]);
        setActiveTab('manage');
        toast.success('Publicação criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar publicação:', error);
      toast.error('Erro ao criar publicação');
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    try {
      const success = await newsletterAdminService.deletePost(postId);
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        toast.success('Publicação excluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      toast.error('Erro ao excluir publicação');
    }
  };
  
  return (
    <Card className="border border-white/10 bg-inventu-dark/90">
      <CardHeader>
        <CardTitle className="text-white">Gerenciamento de Publicações</CardTitle>
        <CardDescription className="text-white/60">
          Crie, edite e gerencie publicações do feed de notícias
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          defaultValue="create" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-inventu-darker">
            <TabsTrigger value="create">Criar Nova</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-4">
            <PostForm onSubmit={handleCreatePost} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p>Nenhuma publicação encontrada</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                posts.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {posts.map(post => (
                  <NewsletterPost 
                    key={post.id} 
                    post={post}
                    onDelete={handleDeletePost}
                    isAdmin={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPostsManagement;
