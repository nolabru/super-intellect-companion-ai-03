
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoRecoveryTool from '@/components/media/VideoRecoveryTool';
import { useAuth } from '@/contexts/AuthContext';
import { useChatState } from '@/hooks/useChatState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, CheckCircle, Copy, ExternalLink, Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const VideoRecoveryPage: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, isMobile } = useChatState();
  const [activeTab, setActiveTab] = useState<string>("recovery");
  const [recoveredUrl, setRecoveredUrl] = useState<string | null>(null);

  const handleVideoRecovered = (url: string) => {
    setRecoveredUrl(url);
  };

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
        
        {recoveredUrl && (
          <Alert className="mb-6 bg-green-900/20 border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Vídeo Recuperado com Sucesso!</AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-sm">O vídeo foi encontrado e está pronto para ser visualizado ou compartilhado.</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(recoveredUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> 
                    Abrir em Nova Aba
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(recoveredUrl);
                      toast.success("URL copiada!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> 
                    Copiar URL
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="recovery" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="recovery">Recuperar Vídeo</TabsTrigger>
            <TabsTrigger value="url">Obter URL</TabsTrigger>
            <TabsTrigger value="batch">Recuperação em Lote</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recovery" className="space-y-6">
            <div className="mb-6">
              <Alert className="bg-blue-900/20 border-blue-700/30">
                <Info className="h-4 w-4" />
                <AlertTitle>Sobre Recuperação de Vídeos</AlertTitle>
                <AlertDescription>
                  Esta ferramenta permite recuperar vídeos gerados que podem estar com problemas de 
                  carregamento ou que não foram corretamente registrados no banco de dados.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <VideoRecoveryTool 
                userId={user?.id} 
                onRecovered={handleVideoRecovered}
              />
              
              <Card className="p-4 bg-blue-900/20 border border-blue-700/30 h-fit">
                <h2 className="text-lg font-medium text-blue-400 mb-2">Dicas para recuperação</h2>
                <ul className="list-disc pl-5 space-y-2 text-blue-300 text-sm">
                  <li>Se você tem uma URL de vídeo diretamente, cole-a no campo "URL do Vídeo" e clique em "Verificar".</li>
                  <li>Se você tem apenas o ID da tarefa, insira-o no campo "ID da Tarefa" e clique em "Recuperar".</li>
                  <li>O sistema tentará várias URLs possíveis automaticamente quando você informar um ID de tarefa.</li>
                  <li>Para tarefas recentes, a recuperação costuma ser mais eficiente.</li>
                  <li>Após verificar que o vídeo é válido, você pode salvá-lo na galeria para acesso futuro.</li>
                </ul>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-6">
            <div className="mb-6">
              <Alert className="bg-blue-900/20 border-blue-700/30">
                <Info className="h-4 w-4" />
                <AlertTitle>Obtenha URLs para Compartilhamento</AlertTitle>
                <AlertDescription>
                  Use esta ferramenta para obter a URL direta de um vídeo gerado. Isso é útil quando você precisa 
                  compartilhar o vídeo em outras plataformas ou incorporá-lo em algum site.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <VideoRecoveryTool 
                userId={user?.id} 
                returnUrlOnly={true}
                onRecovered={handleVideoRecovered}
              />
              
              <Card className="p-4 bg-blue-900/20 border border-blue-700/30 h-fit">
                <h2 className="text-lg font-medium text-blue-400 mb-2">Dicas para obter URLs</h2>
                <ul className="list-disc pl-5 space-y-2 text-blue-300 text-sm">
                  <li>A URL obtida pode ser usada para incorporar o vídeo em sites ou compartilhar em outras plataformas.</li>
                  <li>Você pode copiar a URL para a área de transferência clicando no botão de cópia.</li>
                  <li>Se você tiver apenas o ID da tarefa, use a aba "Por ID da Tarefa" para tentar recuperar o vídeo.</li>
                  <li>As URLs são permanentes e podem ser acessadas mesmo após o encerramento da sessão.</li>
                  <li>Certifique-se de que o vídeo existe antes de compartilhar a URL.</li>
                </ul>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="batch" className="space-y-6">
            <div className="mb-6">
              <Alert className="bg-blue-900/20 border-blue-700/30">
                <Info className="h-4 w-4" />
                <AlertTitle>Recuperação em Lote (Em Breve)</AlertTitle>
                <AlertDescription>
                  Esta funcionalidade permitirá recuperar múltiplos vídeos de uma só vez, 
                  utilizando uma lista de IDs de tarefas ou URLs. Estará disponível em breve.
                </AlertDescription>
              </Alert>
            </div>
            
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium">Funcionalidade em Desenvolvimento</h3>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                  A recuperação em lote permitirá processar múltiplos vídeos simultaneamente.
                  Esta funcionalidade estará disponível em uma atualização futura.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default VideoRecoveryPage;
