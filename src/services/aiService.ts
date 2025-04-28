import { tokenService } from './tokenService';
import { openRouterService, OpenRouterChatMessage, OpenRouterChatParams } from './openRouterService';
import { apiframeService } from './apiframeService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type AIModelType = 'openrouter' | 'apiframe' | 'local';
export type AIModelRole = 'chat' | 'image' | 'video' | 'audio';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  type: AIModelType;
  roles: AIModelRole[];
  maxContext?: number;
  tokensPerRequest?: number;
}

export interface ChatCompletionParams {
  modelId: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResult {
  text: string;
  modelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * AIService - Centralized service for managing AI model interactions
 */
export const aiService = {
  /**
   * Get all available AI models
   */
  async getAvailableModels(): Promise<AIModelInfo[]> {
    try {
      console.log('[AIService] Fetching available models');
      
      const models: AIModelInfo[] = [];
      
      // Fetch OpenRouter models if configured
      if (openRouterService.isApiKeyConfigured()) {
        try {
          const openRouterModels = await openRouterService.listModels();
          
          // Map OpenRouter models to AIModelInfo
          openRouterModels.forEach(model => {
            models.push({
              id: model.id,
              name: model.name || model.id,
              provider: 'OpenRouter',
              type: 'openrouter',
              roles: ['chat'],
              maxContext: model.context_length,
            });
          });
        } catch (err) {
          console.error('[AIService] Error fetching OpenRouter models:', err);
          toast.error('Failed to load OpenRouter models');
        }
      }
      
      // Add APIframe models (hardcoded for now)
      if (apiframeService.isApiKeyConfigured()) {
        // Image models
        models.push(
          {
            id: 'stability-sd-xl',
            name: 'Stable Diffusion XL',
            provider: 'APIframe',
            type: 'apiframe',
            roles: ['image'],
          },
          {
            id: 'openai-dalle-3',
            name: 'DALL-E 3',
            provider: 'APIframe',
            type: 'apiframe',
            roles: ['image'],
          }
        );
        
        // Video models
        models.push(
          {
            id: 'runway-gen2',
            name: 'Runway Gen-2',
            provider: 'APIframe',
            type: 'apiframe',
            roles: ['video'],
          },
          {
            id: 'pika-1',
            name: 'Pika',
            provider: 'APIframe',
            type: 'apiframe',
            roles: ['video'],
          }
        );
        
        // Audio models
        models.push(
          {
            id: 'eleven-labs',
            name: 'ElevenLabs',
            provider: 'APIframe',
            type: 'apiframe',
            roles: ['audio'],
          }
        );
      }
      
      return models;
    } catch (err) {
      console.error('[AIService] Error fetching available models:', err);
      throw new Error('Failed to fetch available AI models');
    }
  },
  
  /**
   * Generate a chat completion
   */
  async generateChatCompletion(
    params: ChatCompletionParams
  ): Promise<ChatCompletionResult> {
    try {
      console.log(`[AIService] Generating chat completion with model ${params.modelId}`);
      
      // Check if user has enough tokens
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const tokenCheck = await tokenService.hasEnoughTokens(userId, params.modelId, 'chat');
        
        if (!tokenCheck.hasEnough) {
          toast.error('Not enough tokens', {
            description: `This operation requires ${tokenCheck.required} tokens. You have ${tokenCheck.remaining} remaining.`
          });
          
          throw new Error('Not enough tokens for this operation');
        }
      }
      
      // For OpenRouter models
      if (params.modelId.includes('/')) {
        const openRouterParams: OpenRouterChatParams = {
          model: params.modelId,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.maxTokens,
        };
        
        const result = await openRouterService.chatCompletion(openRouterParams);
        
        return {
          text: result.choices[0].message.content,
          modelId: params.modelId,
          usage: {
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens
          }
        };
      }
      
      // Placeholder for other model types (to be implemented)
      throw new Error(`Model type not supported: ${params.modelId}`);
    } catch (err) {
      console.error('[AIService] Error in generateChatCompletion:', err);
      throw err;
    }
  },
  
  /**
   * Stream a chat completion
   */
  async streamChatCompletion(
    params: ChatCompletionParams & { stream: true },
    onChunk: (chunk: any) => void
  ): Promise<void> {
    try {
      console.log(`[AIService] Streaming chat completion with model ${params.modelId}`);
      
      // Check if user has enough tokens
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const tokenCheck = await tokenService.hasEnoughTokens(userId, params.modelId, 'chat');
        
        if (!tokenCheck.hasEnough) {
          toast.error('Not enough tokens', {
            description: `This operation requires ${tokenCheck.required} tokens. You have ${tokenCheck.remaining} remaining.`
          });
          
          throw new Error('Not enough tokens for this operation');
        }
      }
      
      // For OpenRouter models
      if (params.modelId.includes('/')) {
        await openRouterService.streamChatCompletion(
          {
            model: params.modelId,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.maxTokens,
            stream: true
          },
          onChunk
        );
        
        return;
      }
      
      // Placeholder for other model types
      throw new Error(`Streaming not supported for model: ${params.modelId}`);
    } catch (err) {
      console.error('[AIService] Error in streamChatCompletion:', err);
      throw err;
    }
  }
};
