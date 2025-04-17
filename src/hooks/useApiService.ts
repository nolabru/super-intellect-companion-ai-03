
import { apiRequestService } from './api/apiRequestService';
import { mediaStorageService } from './api/mediaStorageService';
import { useAuth } from '@/contexts/AuthContext';

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
}

/**
 * Interface para resposta das APIs Google
 */
export interface GoogleApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  link?: string;
  id?: string;
}

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA e APIs Google
 */
export function useApiService() {
  const { user } = useAuth();
  
  return {
    // Serviço principal para comunicação com modelos de IA
    sendRequest: (
      content, 
      mode, 
      modelId, 
      files, 
      params, 
      enableStreaming, 
      streamListener, 
      conversationHistory, 
      userId
    ) => apiRequestService.sendRequest(
      content, 
      mode, 
      modelId, 
      files, 
      params, 
      enableStreaming, 
      streamListener, 
      conversationHistory, 
      userId || user?.id
    ),
    
    // Serviço para armazenamento de mídia
    storeMedia: mediaStorageService.storeMedia,
    
    // Serviços para Google Calendar
    createCalendarEvent: async (
      summary: string,
      description: string,
      start: string,
      end: string,
      attendees: string[] = []
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google/calendar/createEvent',
          {
            summary,
            description,
            start,
            end,
            attendees,
            userId: user?.id
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data, link: data?.link, id: data?.eventId };
      } catch (error) {
        console.error('Error creating calendar event:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error creating event' 
        };
      }
    },
    
    // Serviços para Google Sheets
    writeToSheet: async (
      spreadsheetId: string,
      range: string,
      values: any[][]
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google/sheets/write',
          {
            spreadsheetId,
            range,
            values,
            userId: user?.id
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data, link: data?.spreadsheetUrl };
      } catch (error) {
        console.error('Error writing to sheet:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error writing to sheet' 
        };
      }
    },
    
    readFromSheet: async (
      spreadsheetId: string,
      range: string
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google/sheets/read',
          {
            spreadsheetId,
            range,
            userId: user?.id
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data: data?.values, link: data?.spreadsheetUrl };
      } catch (error) {
        console.error('Error reading from sheet:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error reading from sheet' 
        };
      }
    },
    
    // Serviços para Google Docs
    createDocument: async (
      title: string,
      contentMarkdown: string
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google/docs/create',
          {
            title,
            contentMarkdown,
            userId: user?.id
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data, link: data?.documentUrl, id: data?.documentId };
      } catch (error) {
        console.error('Error creating document:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error creating document' 
        };
      }
    },
    
    updateDocument: async (
      documentId: string,
      contentMarkdown: string
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google/docs/update',
          {
            documentId,
            contentMarkdown,
            userId: user?.id
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data, link: data?.documentUrl };
      } catch (error) {
        console.error('Error updating document:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error updating document' 
        };
      }
    },
    
    // Verificação de permissões do Google
    verifyGooglePermissions: async (
      requiredScopes: string[]
    ): Promise<GoogleApiResponse> => {
      try {
        const { data, error } = await apiRequestService.invokeFunction(
          'google-verify-permissions',
          {
            userId: user?.id,
            requiredScopes
          }
        );
        
        if (error) throw new Error(error);
        return { success: true, data };
      } catch (error) {
        console.error('Error verifying Google permissions:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error verifying permissions' 
        };
      }
    }
  };
}
