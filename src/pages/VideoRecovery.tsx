
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoRecoveryTool from '@/components/media/VideoRecoveryTool';
import { useAuth } from '@/contexts/AuthContext';
import { useChatState } from '@/hooks/useChatState';

const VideoRecoveryPage: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, isMobile } = useChatState();

  return (
    <MainLayout
      sidebarOpen={sidebarOpen}
      onToggleSidebar={toggleSidebar}
      isTouchDevice={isMobile}
    >
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Recuperação de Vídeos</h1>
        
        <div className="mb-8">
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
      </div>
    </MainLayout>
  );
};

export default VideoRecoveryPage;
