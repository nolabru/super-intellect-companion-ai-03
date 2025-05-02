
import { supabase } from '@/integrations/supabase/client';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  type: string;
  roles: string[];
  maxContext?: number;
}

export const aiService = {
  async generateResponse(prompt: string, model: string): Promise<any> {
    try {
      const response = await supabase.functions.invoke('ai-generate', {
        body: { prompt, model }
      });
      
      return response.data;
    } catch (err) {
      console.error('Erro ao gerar resposta IA:', err);
      throw err;
    }
  },
  
  async getAvailableModels(): Promise<AIModelInfo[]> {
    try {
      // This is a stub implementation
      return [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'OpenAI',
          type: 'text',
          roles: ['user', 'assistant', 'system']
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          provider: 'Anthropic',
          type: 'text',
          roles: ['user', 'assistant', 'system'],
          maxContext: 100000
        }
      ];
    } catch (error) {
      console.error('Erro ao buscar modelos disponíveis:', error);
      return [];
    }
  }
};
