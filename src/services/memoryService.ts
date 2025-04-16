
import { supabase } from '@/integrations/supabase/client';

export const memoryService = {
  // Function to extract memory from a message
  async extractMemoryFromMessage(messageContent: string, userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('memory-extractor', {
        body: {
          messageContent,
          userId
        },
      });
      
      if (error) {
        console.error('Error extracting memory:', error);
        return { success: false, error, memoryItems: [] };
      }
      
      return { 
        success: true, 
        error: null, 
        memoryItems: data.memoryItems || [] 
      };
    } catch (err) {
      console.error('Error calling memory extractor:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error', 
        memoryItems: [] 
      };
    }
  },
  
  // Function to get user memory context for a new chat
  async getUserMemoryContext(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_memory')
        .select('key_name, value')
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        return "";
      }
      
      return "User information from previous conversations:\n" + 
        data.map(item => `- ${item.key_name}: ${item.value}`).join('\n');
    } catch (err) {
      console.error('Error getting memory context:', err);
      return "";
    }
  }
};
