
import { supabase } from '@/integrations/supabase/client';
import { OPENROUTER_MODELS_BY_PROVIDER } from '@/constants';

// Usar o token fornecido pelo usuário
let apiKey: string | null = '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';

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  providers?: string[];
}

export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface OpenRouterChatParams {
  model: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenRouterChatResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const openRouterService = {
  setApiKey(key: string): boolean {
    if (!key || key.trim() === '') {
      console.error('[openRouterService] Invalid API key provided');
      return false;
    }
    
    apiKey = key;
    try {
      // Store securely in localStorage for persistence across sessions
      localStorage.setItem('openrouter_api_key', key);
      return true;
    } catch (err) {
      console.error('[openRouterService] Error storing API key:', err);
      return false;
    }
  },
  
  isApiKeyConfigured(): boolean {
    // Já temos um token configurado
    return true;
  },
  
  async chatCompletion(params: OpenRouterChatParams): Promise<OpenRouterChatResponse> {
    try {
      console.log(`[openRouterService] Generating chat completion with model ${params.model}`);
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      const { data, error } = await supabase.functions.invoke('openrouter-chat', {
        body: { 
          params,
          apiKey 
        }
      });
      
      if (error || !data) {
        console.error('[openRouterService] Error generating chat completion:', error || 'No data received');
        throw new Error(error?.message || 'Failed to generate chat completion');
      }
      
      return data;
    } catch (err) {
      console.error('[openRouterService] Error in chatCompletion:', err);
      throw err;
    }
  },
  
  async streamChatCompletion(
    params: OpenRouterChatParams & { stream: true }, 
    onChunk: (chunk: any) => void
  ): Promise<void> {
    try {
      console.log(`[openRouterService] Streaming chat completion with model ${params.model}`);
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || '';
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          params,
          apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to stream chat completion: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader from response');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[openRouterService] Stream complete');
              return;
            }
            
            try {
              const chunk = JSON.parse(data);
              onChunk(chunk);
            } catch (err) {
              console.error('[openRouterService] Error parsing chunk:', err, data);
            }
          }
        }
      }
    } catch (err) {
      console.error('[openRouterService] Error in streamChatCompletion:', err);
      throw err;
    }
  },
  
  async listModels(): Promise<OpenRouterModel[]> {
    try {
      console.log(`[openRouterService] Returning predefined OpenRouter models`);
      
      // Convert our predefined models to the OpenRouterModel format
      const models: OpenRouterModel[] = [];
      
      // Flatten all provider models into a single array
      Object.values(OPENROUTER_MODELS_BY_PROVIDER).forEach(providerModels => {
        providerModels.forEach(model => {
          models.push({
            id: model.id,
            name: model.displayName,
            context_length: 16000, // Default context length
            providers: [model.provider]
          });
        });
      });
      
      return models;
    } catch (err) {
      console.error('[openRouterService] Error in listModels:', err);
      throw err;
    }
  }
};

// Initialize API key from localStorage if available
try {
  const storedKey = localStorage.getItem('openrouter_api_key');
  if (storedKey) {
    apiKey = storedKey;
  }
} catch (err) {
  console.error('[openRouterService] Error loading API key from localStorage:', err);
}
