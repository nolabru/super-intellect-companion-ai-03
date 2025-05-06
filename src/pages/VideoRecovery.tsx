
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoRecoveryTool from '@/components/media/VideoRecoveryTool';
import { useAuth } from '@/contexts/AuthContext';
import { useChatState } from '@/hooks/useChatState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Link, ArrowLeft } from 'lucide-react';

const VideoRecoveryPage: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, isMobile } = useChatState();
  const [activeTab, setActiveTab] = useState<string>("recovery");

  return (
    <MainLayout
      sidebarOpen={sidebarOpen}
      onToggleSidebar={toggleSidebar}
      isTouchDevice={isMobile}
    >
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          
          <h1 className="text-2xl font-bold">Recuperação de Vídeos</h1>
        </div>
        
        <Tabs defaultValue="recovery" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="recovery">Recuperar Vídeo</TabsTrigger>
            <TabsTrigger value="url">Obter URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recovery" className="space-y-6">
            <div className="mb-6">
              <p className="text-gray-300">
                Esta ferramenta permite recuperar vídeos gerados que podem estar com problemas de 
                carregamento ou que não foram corretamente registrados no banco de dados.
              </p>
            </div>
            
            <VideoRecoveryTool userId={user?.id} />
            
            <div className="mt-8 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h2 className="text-lg font-medium text-blue-400 mb-2">Dicas para recuperação</h2>
              <ul className="list-disc pl-5 space-y-2 text-blue-300 text-sm">
                <li>Se você tem uma URL de vídeo diretamente, cole-a no campo "URL do Vídeo" e clique em "Verificar".</li>
                <li>Se você tem apenas o ID da tarefa, insira-o no campo "ID da Tarefa" e clique em "Recuperar". O sistema tentará várias URLs possíveis.</li>
                <li>Vídeos recuperados podem ser salvos na galeria para acesso futuro.</li>
                <li>Após verificar que o vídeo é válido, você pode abri-lo em uma nova aba ou salvá-lo na galeria.</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-6">
            <div className="mb-6">
              <p className="text-gray-300">
                Use esta ferramenta para obter a URL direta de um vídeo gerado. Isso é útil quando você precisa 
                compartilhar o vídeo em outras plataformas ou incorporá-lo em algum site.
              </p>
            </div>
            
            <VideoRecoveryTool userId={user?.id} returnUrlOnly={true} />
            
            <div className="mt-8 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h2 className="text-lg font-medium text-blue-400 mb-2">Dicas para obter URLs</h2>
              <ul className="list-disc pl-5 space-y-2 text-blue-300 text-sm">
                <li>A URL obtida pode ser usada para incorporar o vídeo em sites ou compartilhar em outras plataformas.</li>
                <li>Você pode copiar a URL para a área de transferência clicando no botão de cópia.</li>
                <li>Certifique-se de que o vídeo existe antes de compartilhar a URL.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default VideoRecoveryPage;
