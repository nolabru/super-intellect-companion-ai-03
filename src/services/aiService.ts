
import { tokenService } from './tokenService';
import { openRouterService, OpenRouterChatMessage, OpenRouterChatParams } from './openRouterService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define the types of AI models we can interact with
export type AIModelType = 'openrouter' | 'ideogram' | 'midjourney' | 'local';
export type AIModelRole = 'chat' | 'image';

// Information about an AI model
export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  type: AIModelType;
  roles: AIModelRole[];
  maxContext?: number;
  tokensPerRequest?: number;
}

// Parameters for chat completions
export interface ChatCompletionParams {
  modelId: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Result from a chat completion
export interface ChatCompletionResult {
  text: string;
  modelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Parameters for media generation
export interface MediaGenerationParams {
  modelId: string;
  prompt: string;
  type: 'image';
  additionalParams?: Record<string, any>;
  referenceUrl?: string;
}

// Result from media generation
export interface MediaGenerationResult {
  success: boolean;
  mediaUrl?: string;
  taskId?: string;
  error?: string;
  status?: string;
  tokensConsumed?: number; // Added to track token consumption
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
      
      // Add Ideogram models 
      models.push({
        id: 'ideogram-v2',
        name: 'Ideogram V2',
        provider: 'Ideogram',
        type: 'ideogram',
        roles: ['image'],
      });
      
      // Add Midjourney models
      models.push({
        id: 'midjourney',
        name: 'Midjourney',
        provider: 'Midjourney',
        type: 'midjourney',
        roles: ['image'],
      });
      
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
  },

  /**
   * Generate media (primarily image for Ideogram and Midjourney)
   */
  async generateMedia(
    params: MediaGenerationParams
  ): Promise<MediaGenerationResult> {
    try {
      console.log(`[AIService] Generating ${params.type} with model ${params.modelId}`);

      // Check if user has enough tokens
      const userId = (await supabase.auth.getUser()).data.user?.id;
      let tokensRequired = 0;
      
      if (userId) {
        const tokenCheck = await tokenService.hasEnoughTokens(userId, params.modelId, params.type);
        tokensRequired = tokenCheck.required;
        
        if (!tokenCheck.hasEnough) {
          toast.error('Not enough tokens', {
            description: `This operation requires ${tokenCheck.required} tokens. You have ${tokenCheck.remaining} remaining.`
          });
          
          throw new Error('Not enough tokens for this operation');
        }
      }
      
      // For Ideogram image generation
      if (params.type === 'image' && params.modelId === 'ideogram-v2') {
        try {
          // Call apiframe-ideogram-imagine edge function
          const result = await supabase.functions.invoke('apiframe-ideogram-imagine', {
            body: {
              prompt: params.prompt,
              model: 'V_2', // Required parameter for apiframe
              magic_prompt_option: 'AUTO', // Required parameter for apiframe
              ...params.additionalParams
            }
          });
          
          if (result.error) {
            console.error('[AIService] Error from edge function:', result.error);
            throw new Error(`Ideogram error: ${result.error.message || 'Unknown error'}`);
          }
          
          if (!result.data.success || !result.data.images || result.data.images.length === 0) {
            console.error('[AIService] Invalid response:', result.data);
            throw new Error('No images were generated');
          }
          
          // Consume tokens after successful generation
          if (userId) {
            try {
              await tokenService.consumeTokens(userId, params.modelId, params.type);
              console.log(`[AIService] Consumed ${tokensRequired} tokens for ${params.modelId} ${params.type} generation`);
              
              // Refresh token balance to update UI
              const updatedBalance = await tokenService.getUserTokenBalance(userId);
              
              toast.success(`Image generated successfully`, {
                description: `Used ${tokensRequired} tokens. You have ${updatedBalance.tokensRemaining} tokens remaining.`,
                duration: 3000
              });
            } catch (tokenError) {
              console.error('[AIService] Error consuming tokens:', tokenError);
              // Don't fail the operation if token consumption fails
            }
          }
          
          return {
            success: true,
            mediaUrl: result.data.images[0],
            taskId: result.data.taskId || 'ideogram-task',
            status: 'completed',
            tokensConsumed: tokensRequired
          };
        } catch (err) {
          console.error('[AIService] Error generating Ideogram image:', err);
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err)
          };
        }
      }
      
      // For Midjourney image generation
      if (params.type === 'image' && params.modelId === 'midjourney') {
        try {
          // Call apiframe-midjourney-imagine edge function
          const result = await supabase.functions.invoke('apiframe-midjourney-imagine', {
            body: {
              prompt: params.prompt,
              ...params.additionalParams
            }
          });
          
          if (result.error) {
            console.error('[AIService] Error from edge function:', result.error);
            throw new Error(`Midjourney error: ${result.error.message || 'Unknown error'}`);
          }
          
          // Important: Don't check for images array immediately for Midjourney
          // as it's an asynchronous process
          if (!result.data.success || !result.data.taskId) {
            console.error('[AIService] Invalid response:', result.data);
            throw new Error('Error creating Midjourney task');
          }
          
          // Consume tokens after successful task creation
          if (userId) {
            try {
              await tokenService.consumeTokens(userId, params.modelId, params.type);
              console.log(`[AIService] Consumed ${tokensRequired} tokens for ${params.modelId} ${params.type} generation`);
              
              // Refresh token balance to update UI
              const updatedBalance = await tokenService.getUserTokenBalance(userId);
              
              toast.success(`Midjourney task started`, {
                description: `Used ${tokensRequired} tokens. You have ${updatedBalance.tokensRemaining} tokens remaining. Image will be ready in about a minute.`,
                duration: 5000
              });
            } catch (tokenError) {
              console.error('[AIService] Error consuming tokens:', tokenError);
              // Don't fail the operation if token consumption fails
            }
          }
          
          return {
            success: true,
            taskId: result.data.taskId,
            status: 'processing', // Important: Midjourney tasks should start as processing
            tokensConsumed: tokensRequired
          };
        } catch (err) {
          console.error('[AIService] Error generating Midjourney image:', err);
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err)
          };
        }
      }
      
      throw new Error(`No configuration found for ${params.type} generation with model ${params.modelId}`);
    } catch (err) {
      console.error(`[AIService] Error generating ${params.type}:`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },
  
  /**
   * Check the status of a media generation task
   */
  async checkMediaTaskStatus(taskId: string): Promise<MediaGenerationResult> {
    try {
      console.log(`[AIService] Checking status of task ${taskId}`);
      
      // For Ideogram task, they are immediately complete
      if (taskId === 'ideogram-task') {
        return {
          success: true,
          taskId,
          status: 'completed'
        };
      }
      
      // For all other task IDs, query the API to get current status
      const result = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (result.error) {
        console.error('[AIService] Error checking task status:', result.error);
        return {
          success: false,
          error: `Error checking status: ${result.error.message}`,
          status: 'failed'
        };
      }
      
      if (!result.data) {
        return {
          success: false,
          error: 'No data received from status check',
          status: 'failed'
        };
      }
      
      return {
        success: true,
        taskId: result.data.taskId,
        status: result.data.status,
        mediaUrl: result.data.mediaUrl,
        error: result.data.error
      };
    } catch (err) {
      console.error('[AIService] Error checking task status:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        status: 'failed'
      };
    }
  },

  /**
   * Cancel a media generation task
   */
  async cancelMediaTask(taskId: string): Promise<boolean> {
    console.log(`[AIService] Cancel not applicable for API FRAME tasks: ${taskId}`);
    return false;
  }
};
