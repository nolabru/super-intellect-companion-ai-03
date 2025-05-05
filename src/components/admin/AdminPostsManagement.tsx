
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
        const postsData = await newsletterService.getPosts();
        setPosts(postsData.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
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
          title: newPost.content?.substring(0, 50) || '',
          view_count: 0,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          user_has_liked: false,
          author_name: '',
          author_avatar: null,
          author: {
            username: '',
            avatar_url: null
          }
        };
        setPosts(prev => [enhancedPost, ...prev]);
        setActiveTab('manage');
        toast.success('Publicação criada com sucesso!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
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
      console.error('Error deleting post:', error);
      toast.error('Erro ao excluir publicação');
    }
  };

  return <Card className="border border-white/10 bg-inventu-dark/90">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Gerenciamento de Publicações</CardTitle>
        <CardDescription className="text-white/60 text-sm">
          Crie, edite e gerencie publicações do feed de notícias
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-[24px] py-0">
        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-inventu-darker">
            <TabsTrigger value="create">Criar Nova</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-4">
            <PostForm onSubmit={handleCreatePost} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-4">
            {isLoading ? <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
              </div> : posts.length === 0 ? <div className="text-center py-8 text-white/60">
                <p>Nenhuma publicação encontrada</p>
              </div> : <div className={cn("grid gap-4", posts.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                {posts.map(post => <NewsletterPost key={post.id} post={post} onDelete={handleDeletePost} />)}
              </div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};

export default AdminPostsManagement;
