
import { supabase } from '@/integrations/supabase/client';

export const aiService = {
  async generateResponse(prompt: string, model: string): Promise<any> {
    try {
      const response = await supabase.functions.invoke('ai-generate', {
        body: { prompt, model }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error generating AI response:', err);
      throw err;
    }
  }
};
