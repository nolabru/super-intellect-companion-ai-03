
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Tipos para os agentes
export type GoogleAgentType = 'drive' | 'sheet' | 'calendar';

export interface GoogleAgentResponse {
  success: boolean;
  followupPrompt?: string;
  needsMoreInfo: boolean;
  actionReady: boolean;
  action?: GoogleAction;
}

export interface GoogleAction {
  type: string;
  parameters: Record<string, any>;
}

// Interface para os agentes
export interface GoogleAgent {
  name: string;
  description: string;
  triggerWord: string;
  validateInput: (content: string) => GoogleAgentResponse;
  generatePrompt: (content: string) => string;
  executeAction: (userId: string, content: string) => Promise<any>;
}

// Agente para Google Drive
export const DriveAgent: GoogleAgent = {
  name: 'Google Drive Agent',
  description: 'Cria documentos no Google Drive',
  triggerWord: '@drive',
  
  validateInput: (content: string): GoogleAgentResponse => {
    const sanitizedContent = content.replace('@drive', '').trim();
    
    // Verificar se temos informações mínimas necessárias
    const hasTitleInfo = /crie\s+(um|uma)\s+(documento|doc|texto|arquivo)/i.test(sanitizedContent);
    const hasTitle = /(chamado|intitulado|nomeado|com\s+o\s+título|com\s+título)/i.test(sanitizedContent);
    
    // Se for um comando muito curto sem detalhes suficientes
    if (sanitizedContent.length < 10 || (!hasTitleInfo && !hasTitle)) {
      return {
        success: true,
        needsMoreInfo: true,
        actionReady: false,
        followupPrompt: `Para criar um documento no Google Drive, preciso das seguintes informações:
        
1. Qual deve ser o título do documento?
2. Que tipo de conteúdo você deseja incluir nele?

Por favor, forneça essas informações.`
      };
    }
    
    // Extrair o título do documento usando expressões regulares
    let title = "Novo Documento";
    const titleMatch = sanitizedContent.match(/(chamado|intitulado|nomeado|com\s+o\s+título|com\s+título)\s+"?([^"]+)"?/i);
    
    if (titleMatch && titleMatch[2]) {
      title = titleMatch[2].trim();
    } else {
      // Tentar uma abordagem mais simples
      const words = sanitizedContent.split(/\s+/);
      if (words.length > 3) {
        title = words.slice(2, 5).join(" ");
      }
    }
    
    // Verificar se temos informações suficientes para criar o documento
    return {
      success: true,
      needsMoreInfo: false,
      actionReady: true,
      action: {
        type: 'createDocument',
        parameters: {
          name: title,
          content: sanitizedContent
        }
      }
    };
  },
  
  generatePrompt: (content: string): string => {
    return `Para criar um documento no Google Drive, preciso das seguintes informações:
    
1. Qual deve ser o título do documento?
2. Que tipo de conteúdo você deseja incluir nele?

Por favor, forneça essas informações.`;
  },
  
  executeAction: async (userId: string, content: string): Promise<any> => {
    try {
      const response = DriveAgent.validateInput(content);
      
      if (!response.actionReady || !response.action) {
        throw new Error("Informações insuficientes para criar documento");
      }
      
      // Executar chamada para função edge do Google
      const result = await supabase.functions.invoke('google-actions', {
        body: {
          userId,
          action: 'createDocument',
          params: response.action.parameters
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: true, 
        message: "Documento criado com sucesso!",
        data: result.data
      };
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      return {
        success: false,
        message: `Erro ao criar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
};

// Agente para Google Sheets
export const SheetAgent: GoogleAgent = {
  name: 'Google Sheets Agent',
  description: 'Cria planilhas no Google Sheets',
  triggerWord: '@sheet',
  
  validateInput: (content: string): GoogleAgentResponse => {
    const sanitizedContent = content.replace('@sheet', '').trim();
    
    // Verificar se temos informações mínimas necessárias
    const hasPlanilhaInfo = /crie\s+(um|uma)\s+(planilha|spreadsheet)/i.test(sanitizedContent);
    const hasContent = /(com|contendo|conten[h|d]a)/i.test(sanitizedContent);
    
    // Se for um comando muito curto sem detalhes suficientes
    if (sanitizedContent.length < 10 || (!hasPlanilhaInfo && !hasContent)) {
      return {
        success: true,
        needsMoreInfo: true,
        actionReady: false,
        followupPrompt: `Para criar uma planilha no Google Sheets, preciso das seguintes informações:
        
1. Qual deve ser o título da planilha?
2. Que tipo de dados você deseja incluir nela? 
   (Por exemplo: "com 3 nomes aleatórios", "com uma tabela de produtos", etc.)

Por favor, forneça essas informações.`
      };
    }
    
    // Extrair o título da planilha (opcional, podemos criar um padrão)
    let title = "Nova Planilha";
    
    // Verificar título explícito
    const titleMatch = sanitizedContent.match(/(chamad[ao]|intitulad[ao]|nomead[ao]|com\s+o\s+título|com\s+título)\s+"?([^"]+)"?/i);
    
    if (titleMatch && titleMatch[2]) {
      title = titleMatch[2].trim();
    } else {
      // Gerar título baseado no conteúdo
      title = `Planilha ${new Date().toLocaleDateString('pt-BR')}`;
    }
    
    // Verificar conteúdo específico para nomes aleatórios
    const randomNamesMatch = sanitizedContent.match(/com\s+(\d+)\s+nomes\s+aleat[óo]rios/i);
    let content = sanitizedContent;
    
    if (randomNamesMatch && randomNamesMatch[1]) {
      content = `com ${randomNamesMatch[1]} nomes aleatórios`;
    }
    
    // Verificar se temos informações suficientes para criar a planilha
    return {
      success: true,
      needsMoreInfo: false,
      actionReady: true,
      action: {
        type: 'createSpreadsheet',
        parameters: {
          title,
          content,
          sheets: [{ title: 'Página1' }]
        }
      }
    };
  },
  
  generatePrompt: (content: string): string => {
    return `Para criar uma planilha no Google Sheets, preciso das seguintes informações:
    
1. Qual deve ser o título da planilha?
2. Que tipo de dados você deseja incluir nela? 
   (Por exemplo: "com 3 nomes aleatórios", "com uma tabela de produtos", etc.)

Por favor, forneça essas informações.`;
  },
  
  executeAction: async (userId: string, content: string): Promise<any> => {
    try {
      const response = SheetAgent.validateInput(content);
      
      if (!response.actionReady || !response.action) {
        throw new Error("Informações insuficientes para criar planilha");
      }
      
      // Executar chamada para função edge do Google
      const result = await supabase.functions.invoke('google-actions', {
        body: {
          userId,
          action: 'createSpreadsheet',
          params: response.action.parameters
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: true, 
        message: "Planilha criada com sucesso!",
        data: result.data
      };
    } catch (error) {
      console.error("Erro ao criar planilha:", error);
      return {
        success: false,
        message: `Erro ao criar planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
};

// Agente para Google Calendar
export const CalendarAgent: GoogleAgent = {
  name: 'Google Calendar Agent',
  description: 'Cria eventos no Google Calendar',
  triggerWord: '@calendar',
  
  validateInput: (content: string): GoogleAgentResponse => {
    const sanitizedContent = content.replace('@calendar', '').trim();
    
    // Verificar se temos informações mínimas necessárias
    const hasEventInfo = /crie\s+(um|uma)\s+(evento|reuni[ãa]o|compromisso|appointment|meeting)/i.test(sanitizedContent);
    const hasDateInfo = /(hoje|amanhã|dia|em|às|as|\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+\w+)/i.test(sanitizedContent);
    
    // Se for um comando muito curto sem detalhes suficientes
    if (sanitizedContent.length < 10 || (!hasEventInfo && !hasDateInfo)) {
      return {
        success: true,
        needsMoreInfo: true,
        actionReady: false,
        followupPrompt: `Para criar um evento no Google Calendar, preciso das seguintes informações:
        
1. Qual é o título ou assunto do evento?
2. Quando será o evento? (data e horário)
3. Qual a duração do evento?
4. Há alguma descrição adicional?
5. Deseja convidar outras pessoas? (forneça os emails)

Por favor, forneça essas informações.`
      };
    }
    
    // Extrair o título do evento
    let summary = "Novo Evento";
    const titleMatch = sanitizedContent.match(/(chamado|intitulado|nomeado|com\s+o\s+título|com\s+título|sobre)\s+"?([^"]+)"?/i);
    
    if (titleMatch && titleMatch[2]) {
      summary = titleMatch[2].trim();
    } else {
      // Extrair baseado em padrão simples se possível
      const words = sanitizedContent.split(/\s+/);
      if (words.length > 3) {
        summary = words.slice(2, 5).join(" ");
      }
    }
    
    // Tentativa simples de extrair data e hora
    // Na implementação real seria necessário um parser mais robusto
    const dateTimeNow = new Date();
    dateTimeNow.setHours(dateTimeNow.getHours() + 1);
    const dateTimeEnd = new Date(dateTimeNow);
    dateTimeEnd.setHours(dateTimeEnd.getHours() + 1);
    
    // Em uma implementação mais completa, analisaríamos o texto para extrair 
    // data, hora, duração, etc.
    
    // Verificar se temos informações suficientes para criar o evento
    return {
      success: true,
      needsMoreInfo: false,
      actionReady: true,
      action: {
        type: 'createCalendarEvent',
        parameters: {
          summary,
          description: sanitizedContent,
          startDateTime: dateTimeNow.toISOString(),
          endDateTime: dateTimeEnd.toISOString(),
          timeZone: 'America/Sao_Paulo',
          attendees: []
        }
      }
    };
  },
  
  generatePrompt: (content: string): string => {
    return `Para criar um evento no Google Calendar, preciso das seguintes informações:
    
1. Qual é o título ou assunto do evento?
2. Quando será o evento? (data e horário)
3. Qual a duração do evento?
4. Há alguma descrição adicional?
5. Deseja convidar outras pessoas? (forneça os emails)

Por favor, forneça essas informações.`;
  },
  
  executeAction: async (userId: string, content: string): Promise<any> => {
    try {
      const response = CalendarAgent.validateInput(content);
      
      if (!response.actionReady || !response.action) {
        throw new Error("Informações insuficientes para criar evento");
      }
      
      // Executar chamada para função edge do Google
      const result = await supabase.functions.invoke('google-actions', {
        body: {
          userId,
          action: 'createCalendarEvent',
          params: response.action.parameters
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: true, 
        message: "Evento criado com sucesso!",
        data: result.data
      };
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      return {
        success: false,
        message: `Erro ao criar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
};

// Mapa de agentes por tipo
export const GOOGLE_AGENTS: Record<GoogleAgentType, GoogleAgent> = {
  drive: DriveAgent,
  sheet: SheetAgent,
  calendar: CalendarAgent
};

// Função para identificar qual agente usar com base no comando
export function identifyGoogleAgent(content: string): GoogleAgent | null {
  if (content.trim().startsWith('@drive')) {
    return GOOGLE_AGENTS.drive;
  } else if (content.trim().startsWith('@sheet')) {
    return GOOGLE_AGENTS.sheet;
  } else if (content.trim().startsWith('@calendar')) {
    return GOOGLE_AGENTS.calendar;
  }
  return null;
}

// Função para processar um comando Google e executar a ação através do agente apropriado
export async function processGoogleCommand(userId: string, content: string): Promise<{
  success: boolean;
  needsMoreInfo: boolean;
  followupPrompt?: string;
  result?: any;
  message?: string;
}> {
  try {
    // Identificar qual agente deve processar o comando
    const agent = identifyGoogleAgent(content);
    
    if (!agent) {
      return {
        success: false,
        needsMoreInfo: false,
        message: "Comando não reconhecido. Use @drive, @sheet ou @calendar."
      };
    }
    
    // Validar se temos informações suficientes para realizar a ação
    const validation = agent.validateInput(content);
    
    // Se precisamos de mais informações, retornar o prompt de follow-up
    if (validation.needsMoreInfo) {
      return {
        success: true,
        needsMoreInfo: true,
        followupPrompt: validation.followupPrompt
      };
    }
    
    // Se temos tudo que precisamos, executar a ação
    if (validation.actionReady) {
      const result = await agent.executeAction(userId, content);
      
      if (!result.success) {
        toast.error(result.message);
        return {
          success: false,
          needsMoreInfo: false,
          message: result.message
        };
      }
      
      toast.success(result.message);
      return {
        success: true,
        needsMoreInfo: false,
        result: result.data
      };
    }
    
    // Caso de falha genérico
    return {
      success: false,
      needsMoreInfo: true,
      followupPrompt: agent.generatePrompt(content)
    };
  } catch (error) {
    console.error("Erro ao processar comando Google:", error);
    
    return {
      success: false,
      needsMoreInfo: false,
      message: `Erro ao processar comando: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}
