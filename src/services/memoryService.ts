
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
  },

  // Function to detect content type and suggest mode change
  async detectContentTypeAndMode(messageContent: string) {
    // Simple pattern matching for mode detection
    const patterns = {
      image: [
        /imagem de/i, /mostre (uma|um) imagem/i, /gere (uma|um) imagem/i, 
        /desenhe/i, /criar (uma|um) imagem/i, /visualizar/i, 
        /foto de/i, /ilustra[çc][ãa]o/i
      ],
      video: [
        /v[íi]deo de/i, /crie (um|uma) v[íi]deo/i, /gere (um|uma) v[íi]deo/i, 
        /anima[çc][ãa]o de/i, /mostrar em v[íi]deo/i, /simula[çc][ãa]o/i
      ],
      audio: [
        /[áa]udio de/i, /leia em voz alta/i, /narrar/i, /fale/i,
        /som de/i, /pronunciar/i, /diga/i, /converter para [áa]udio/i
      ]
    };
    
    // Check for each pattern
    for (const [mode, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageContent)) {
          return mode as 'image' | 'video' | 'audio';
        }
      }
    }
    
    return 'text'; // Default mode
  },
  
  // Get default model for a given mode
  getDefaultModelForMode(mode: string) {
    const defaultModels: Record<string, string> = {
      'text': 'gpt-4o',
      'image': 'luma-image',
      'video': 'luma-video',
      'audio': 'elevenlabs-tts'
    };
    
    return defaultModels[mode] || 'gpt-4o';
  }
};
