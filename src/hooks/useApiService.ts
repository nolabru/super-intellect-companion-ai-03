
/**
 * Interface para resposta da API
 */
export interface ApiResponse {
  content: string;
  files?: string[];
  error?: string;
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
  modeSwitch?: {
    newMode: string;
    newModel: string;
  };
  googleResult?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

/**
 * Hook that provides API services for communication with AI models
 * (Mock implementation - no backend)
 */
export function useApiService() {
  return {
    sendRequest: async (
      content: string, 
      mode: string, 
      modelId: string, 
      files: string[] = [], 
      params = {}, 
      enableStreaming = false, 
      streamListener?: (chunk: string) => void, 
      conversationHistory = [], 
      userId?: string
    ) => {
      console.log('Mock API request:', { content, mode, modelId, files, params });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockResponse: ApiResponse = {
        content: "Este é um exemplo de resposta simulada. O backend foi removido conforme solicitado.",
        tokenInfo: {
          tokensUsed: 10,
          tokensRemaining: 1000
        }
      };

      // If streaming is enabled and a listener is provided
      if (enableStreaming && streamListener) {
        // Split the mock response into chunks to simulate streaming
        const words = mockResponse.content.split(' ');
        let accumulatedContent = '';
        
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          accumulatedContent += words[i] + ' ';
          streamListener(accumulatedContent);
        }
      }

      return mockResponse;
    },
    
    storeMedia: async (
      mediaUrl: string,
      fileName?: string,
      contentType?: string,
      userId?: string,
      conversationId?: string,
      mode?: string
    ) => {
      console.log('Mock store media:', { mediaUrl, fileName, contentType });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock response
      return {
        success: true,
        publicUrl: mediaUrl,
        storagePath: 'mock-storage-path/' + (fileName || 'file.png')
      };
    }
  };
}
