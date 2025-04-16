
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para análise de conteúdo e detecção de padrões
 */
export const contentAnalysisService = {
  /**
   * Detecta o tipo de conteúdo e sugere modo de chat usando o orquestrador
   * @param messageContent Conteúdo da mensagem
   * @returns Modo sugerido (text, image, video, audio)
   */
  async detectContentTypeAndMode(messageContent: string) {
    try {
      // Tente usar o orquestrador para analisar o modo
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          content: messageContent,
          mode: 'text',
          modelId: 'gpt-4o-mini',
          orchestratorOnly: true, // Flag para indicar que só queremos a análise do orquestrador
        },
      });
      
      if (error) {
        console.warn('[contentAnalysisService] Erro usando orquestrador para detecção de modo, voltando para pattern matching:', error);
        // Se falhar, use o método tradicional de pattern matching
        return this.detectContentTypeByPatterns(messageContent);
      }
      
      if (data && data.modeSwitch && data.modeSwitch.newMode) {
        return data.modeSwitch.newMode;
      }
      
      // Fallback para pattern matching
      return this.detectContentTypeByPatterns(messageContent);
    } catch (err) {
      console.error('[contentAnalysisService] Erro na detecção de modo orquestrada:', err);
      return this.detectContentTypeByPatterns(messageContent);
    }
  },
  
  /**
   * Método de fallback para detectar o tipo de conteúdo por padrões
   * @param messageContent Conteúdo da mensagem
   * @returns Modo sugerido (text, image, video, audio)
   */
  detectContentTypeByPatterns(messageContent: string) {
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
      for (const regex of regexList as RegExp[]) {
        if (regex.test(messageContent)) {
          return mode as 'image' | 'video' | 'audio';
        }
      }
    }
    
    return 'text'; // Default mode
  },
  
  /**
   * Obtém o modelo padrão para um determinado modo
   * @param mode Modo de chat
   * @returns ID do modelo padrão para o modo
   */
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
