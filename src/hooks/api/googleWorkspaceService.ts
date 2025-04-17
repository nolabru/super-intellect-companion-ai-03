
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para integração com Google Workspace
 */
export const googleWorkspaceService = {
  /**
   * Serviços do Google Calendar
   */
  calendar: {
    /**
     * Criar um novo evento no Google Calendar
     */
    createEvent: async (
      title: string,
      description: string,
      startDateTime: string,
      endDateTime: string,
      attendees?: string[],
      location?: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
          body: {
            title,
            description,
            startDateTime,
            endDateTime,
            attendees: attendees || [],
            location: location || '',
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao criar evento no Google Calendar:', error);
        throw error;
      }
    },

    /**
     * Listar eventos do Google Calendar
     */
    listEvents: async (
      timeMin: string,
      timeMax: string,
      maxResults: number = 10,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-calendar-list-events', {
          body: {
            timeMin,
            timeMax,
            maxResults,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao listar eventos do Google Calendar:', error);
        throw error;
      }
    }
  },

  /**
   * Serviços do Google Sheets
   */
  sheets: {
    /**
     * Criar uma nova planilha no Google Sheets
     */
    createSheet: async (
      title: string,
      data: any[][],
      userId?: string
    ) => {
      try {
        const { data: responseData, error } = await supabase.functions.invoke('google-sheets-create', {
          body: {
            title,
            data,
            userId
          }
        });

        if (error) throw error;
        return responseData;
      } catch (error) {
        console.error('Erro ao criar planilha no Google Sheets:', error);
        throw error;
      }
    },

    /**
     * Ler dados de uma planilha do Google Sheets
     */
    readSheet: async (
      spreadsheetId: string,
      range: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-sheets-read', {
          body: {
            spreadsheetId,
            range,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao ler dados do Google Sheets:', error);
        throw error;
      }
    },

    /**
     * Atualizar dados em uma planilha do Google Sheets
     */
    updateSheet: async (
      spreadsheetId: string,
      range: string,
      data: any[][],
      userId?: string
    ) => {
      try {
        const { data: responseData, error } = await supabase.functions.invoke('google-sheets-update', {
          body: {
            spreadsheetId,
            range,
            data,
            userId
          }
        });

        if (error) throw error;
        return responseData;
      } catch (error) {
        console.error('Erro ao atualizar dados no Google Sheets:', error);
        throw error;
      }
    }
  },

  /**
   * Serviços do Google Docs
   */
  docs: {
    /**
     * Criar um novo documento no Google Docs
     */
    createDoc: async (
      title: string,
      content: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-docs-create', {
          body: {
            title,
            content,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao criar documento no Google Docs:', error);
        throw error;
      }
    },

    /**
     * Atualizar um documento existente no Google Docs
     */
    updateDoc: async (
      documentId: string,
      content: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-docs-update', {
          body: {
            documentId,
            content,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao atualizar documento no Google Docs:', error);
        throw error;
      }
    }
  },

  /**
   * Serviços do Google Drive
   */
  drive: {
    /**
     * Fazer upload de um arquivo para o Google Drive
     */
    uploadFile: async (
      fileName: string,
      fileContent: string | Blob,
      mimeType: string,
      folderId?: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-drive-upload', {
          body: {
            fileName,
            fileContent: typeof fileContent === 'string' ? fileContent : await fileContent.text(),
            mimeType,
            folderId,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao fazer upload para o Google Drive:', error);
        throw error;
      }
    },

    /**
     * Criar uma pasta no Google Drive
     */
    createFolder: async (
      folderName: string,
      parentFolderId?: string,
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-drive-create-folder', {
          body: {
            folderName,
            parentFolderId,
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao criar pasta no Google Drive:', error);
        throw error;
      }
    }
  },

  /**
   * Serviços do Gmail
   */
  gmail: {
    /**
     * Enviar um e-mail via Gmail
     */
    sendEmail: async (
      to: string[],
      subject: string,
      body: string,
      cc?: string[],
      bcc?: string[],
      attachments?: { filename: string; content: string; mimeType: string }[],
      userId?: string
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke('google-gmail-send', {
          body: {
            to,
            subject,
            body,
            cc: cc || [],
            bcc: bcc || [],
            attachments: attachments || [],
            userId
          }
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Erro ao enviar e-mail via Gmail:', error);
        throw error;
      }
    }
  }
};
