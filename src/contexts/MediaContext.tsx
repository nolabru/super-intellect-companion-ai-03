
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaTask {
  id: string;
  type: 'image' | 'video' | 'audio';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  prompt: string;
  model: string;
  createdAt: Date;
}

interface MediaContextType {
  tasks: MediaTask[];
  isLoading: boolean;
  fetchMediaTasks: () => Promise<void>;
  deleteMediaTask: (id: string) => Promise<boolean>;
}

// Criar contexto com valores padrão
const MediaContext = createContext<MediaContextType>({
  tasks: [],
  isLoading: false,
  fetchMediaTasks: async () => {},
  deleteMediaTask: async () => false
});

// Hook personalizado para usar o contexto
export const useMediaContext = () => useContext(MediaContext);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<MediaTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar tarefas de mídia do usuário atual
  const fetchMediaTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Obter usuário atual
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        setTasks([]);
        return;
      }
      
      // Buscar tarefas do PiAPI
      const { data: piapiData, error: piapiError } = await supabase
        .from('piapi_tasks')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      if (piapiError) {
        console.error('Erro ao buscar tarefas PiAPI:', piapiError);
        throw piapiError;
      }
      
      // Buscar tarefas do APIFrame
      const { data: apiframeData, error: apiframeError } = await supabase
        .from('apiframe_tasks')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      if (apiframeError) {
        console.error('Erro ao buscar tarefas APIFrame:', apiframeError);
        throw apiframeError;
      }
      
      // Combinar e formatar os dados
      const combinedTasks: MediaTask[] = [
        ...(piapiData || []).map(task => ({
          id: task.id,
          type: task.media_type as 'image' | 'video' | 'audio',
          status: task.status as 'pending' | 'processing' | 'completed' | 'failed',
          url: task.media_url,
          prompt: task.prompt || '',
          model: task.model,
          createdAt: new Date(task.created_at)
        })),
        ...(apiframeData || []).map(task => ({
          id: task.id,
          type: task.media_type as 'image' | 'video' | 'audio',
          status: task.status as 'pending' | 'processing' | 'completed' | 'failed',
          url: task.media_url,
          prompt: task.prompt || '',
          model: task.model,
          createdAt: new Date(task.created_at)
        }))
      ];
      
      // Ordenar por data de criação (mais recentes primeiro)
      combinedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setTasks(combinedTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas de mídia:', error);
      toast.error('Erro ao carregar histórico de mídia');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Excluir tarefa de mídia
  const deleteMediaTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Verificar em qual tabela a tarefa existe
      const { data: piapiTask } = await supabase
        .from('piapi_tasks')
        .select('id')
        .eq('id', id)
        .maybeSingle();
        
      const { data: apiframeTask } = await supabase
        .from('apiframe_tasks')
        .select('id')
        .eq('id', id)
        .maybeSingle();
        
      // Excluir da tabela apropriada
      if (piapiTask) {
        const { error } = await supabase
          .from('piapi_tasks')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
      } else if (apiframeTask) {
        const { error } = await supabase
          .from('apiframe_tasks')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
      } else {
        throw new Error('Tarefa não encontrada');
      }
      
      // Atualizar estado
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      toast.success('Item excluído com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao excluir tarefa de mídia:', error);
      toast.error('Erro ao excluir item');
      return false;
    }
  }, []);

  // Carregar tarefas inicialmente
  React.useEffect(() => {
    fetchMediaTasks();
  }, [fetchMediaTasks]);

  return (
    <MediaContext.Provider value={{ tasks, isLoading, fetchMediaTasks, deleteMediaTask }}>
      {children}
    </MediaContext.Provider>
  );
};
