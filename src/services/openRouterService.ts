
import { supabase } from '@/integrations/supabase/client';

// Fixed API key for OpenRouter
const OPENROUTER_API_KEY = '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';

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
  isApiKeyConfigured(): boolean {
    // Always return true as we're using a fixed API key
    return true;
  },
  
  async chatCompletion(params: OpenRouterChatParams): Promise<OpenRouterChatResponse> {
    try {
      console.log(`[openRouterService] Generating chat completion with model ${params.model}`);
      
      const { data, error } = await supabase.functions.invoke('openrouter-chat', {
        body: { 
          params,
          apiKey: OPENROUTER_API_KEY
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
          apiKey: OPENROUTER_API_KEY
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
      console.log(`[openRouterService] Fetching available models`);
      
      const { data, error } = await supabase.functions.invoke('openrouter-models', {
        body: { 
          apiKey: OPENROUTER_API_KEY
        }
      });
      
      if (error || !data) {
        console.error('[openRouterService] Error fetching models:', error || 'No data received');
        throw new Error(error?.message || 'Failed to fetch models');
      }
      
      return data.data || [];
    } catch (err) {
      console.error('[openRouterService] Error in listModels:', err);
      throw err;
    }
  }
};
