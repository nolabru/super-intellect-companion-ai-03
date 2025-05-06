import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  text: string;
  modelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ChatServiceOptions {
  model?: string;
  useEdgeFunction?: boolean;
  settings?: Record<string, any>;
}

export function useChatServiceAdapter() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Load API key from local storage on mount
  useCallback(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);
  
  // Function to save the API key to local storage
  const configureApiKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
    setApiKey(key);
  };
  
  const isApiKeyConfigured = () => {
    return apiKey !== null;
  };
  
  const sendMessage = async (message: string, options: ChatServiceOptions = {}): Promise<ChatResponse> => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `Você é um assistente virtual prestativo e amigável.
          Você deve responder a todas as perguntas da forma mais completa e precisa possível.
          Você deve sempre responder em português.`
      };
      
      const userMessage: ChatMessage = {
        role: 'user',
        content: message
      };
      
      const allMessages: ChatMessage[] = [systemMessage, userMessage];
      
      // Attempt to call the appropriate model's API
      if (options.useEdgeFunction || !apiKey) {
        // Call Edge Function
        const { data, error } = await supabase.functions.invoke(
          'ai-chat',
          { 
            body: { 
              messages: allMessages, 
              model: options.model || 'gpt-3.5-turbo',
              settings: { ...options.settings }
            } 
          }
        );
          
        if (error) {
          console.error('[ChatService] Edge function error:', error);
          throw new Error(`Error from AI Chat: ${error.message}`);
        }
          
        return data;
      } else {
        // Direct call to OpenAI
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: options.model || 'gpt-3.5-turbo',
            messages: allMessages,
            ...options.settings
          })
        });
        
        if (!openaiResponse.ok) {
          console.error('[ChatService] OpenAI API error:', openaiResponse.status, openaiResponse.statusText);
          throw new Error(`OpenAI API Error: ${openaiResponse.status} ${openaiResponse.statusText}`);
        }
        
        const data = await openaiResponse.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response from OpenAI API');
        }
        
        return {
          text: data.choices[0].message.content,
          modelId: options.model || 'gpt-3.5-turbo',
          usage: {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          }
        };
      }
    } catch (error) {
      console.error('[ChatService] Error sending message:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  };
  
  const streamMessage = async (message: string, options: ChatServiceOptions = {}, onChunk: (chunk: string) => void): Promise<ChatResponse> => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `Você é um assistente virtual prestativo e amigável.
          Você deve responder a todas as perguntas da forma mais completa e precisa possível.
          Você deve sempre responder em português.`
      };
      
      const userMessage: ChatMessage = {
        role: 'user',
        content: message
      };
      
      const allMessages: ChatMessage[] = [systemMessage, userMessage];
      
      // Call OpenAI API for streaming
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: allMessages,
          stream: true,
          ...options.settings
        })
      });
      
      if (!openaiResponse.ok) {
        console.error('[ChatService] OpenAI API error:', openaiResponse.status, openaiResponse.statusText);
        throw new Error(`OpenAI API Error: ${openaiResponse.status} ${openaiResponse.statusText}`);
      }
      
      const reader = openaiResponse.body?.getReader();
      const decoder = new TextDecoder();
      let completeResponse = '';
      
      if (!reader) {
        throw new Error('Failed to get reader from OpenAI API response');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value);
        
        // Extract content from the event stream
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') {
            break; // Stream finished
          }
          
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0].delta.content;
            
            if (content) {
              completeResponse += content;
              onChunk(content); // Send chunk to the handler
            }
          } catch (err) {
            console.error('Could not JSON parse stream message', message, err);
          }
        }
      }
      
      return {
        text: completeResponse,
        modelId: options.model || 'gpt-3.5-turbo',
      };
    } catch (error) {
      console.error('[ChatService] Error streaming message:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  };
  
  return {
    sendMessage,
    streamMessage,
    configureApiKey,
    isApiKeyConfigured
  };
}
