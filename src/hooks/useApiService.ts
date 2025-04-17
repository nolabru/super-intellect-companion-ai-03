
import { apiRequestService } from './api/apiRequestService';
import { mediaStorageService } from './api/mediaStorageService';
import { googleWorkspaceService } from './api/googleWorkspaceService';
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
  googleResult?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
  const { user } = useAuth();
  
  return {
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
    storeMedia: mediaStorageService.storeMedia,
    googleWorkspace: {
      calendar: {
        createEvent: (title, description, startDateTime, endDateTime, attendees, location) => 
          googleWorkspaceService.calendar.createEvent(title, description, startDateTime, endDateTime, attendees, location, user?.id),
        listEvents: (timeMin, timeMax, maxResults) => 
          googleWorkspaceService.calendar.listEvents(timeMin, timeMax, maxResults, user?.id)
      },
      sheets: {
        createSheet: (title, data) => 
          googleWorkspaceService.sheets.createSheet(title, data, user?.id),
        readSheet: (spreadsheetId, range) => 
          googleWorkspaceService.sheets.readSheet(spreadsheetId, range, user?.id),
        updateSheet: (spreadsheetId, range, data) => 
          googleWorkspaceService.sheets.updateSheet(spreadsheetId, range, data, user?.id)
      },
      docs: {
        createDoc: (title, content) => 
          googleWorkspaceService.docs.createDoc(title, content, user?.id),
        updateDoc: (documentId, content) => 
          googleWorkspaceService.docs.updateDoc(documentId, content, user?.id)
      },
      drive: {
        uploadFile: (fileName, fileContent, mimeType, folderId) => 
          googleWorkspaceService.drive.uploadFile(fileName, fileContent, mimeType, folderId, user?.id),
        createFolder: (folderName, parentFolderId) => 
          googleWorkspaceService.drive.createFolder(folderName, parentFolderId, user?.id)
      },
      gmail: {
        sendEmail: (to, subject, body, cc, bcc, attachments) => 
          googleWorkspaceService.gmail.sendEmail(to, subject, body, cc, bcc, attachments, user?.id)
      }
    }
  };
}
