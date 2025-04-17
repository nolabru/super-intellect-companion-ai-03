
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { ApiResponse } from '@/hooks/useApiService';
import { ConversationType } from '@/types/conversation';
import { saveMessageToDatabase } from '@/utils/conversationUtils';
import { validateChatMode, getLoadingMessage, modelSupportsStreaming } from './chatModeUtils';
import { supabase } from '@/integrations/supabase/client';

// Sistema de instrução para cada um dos agentes do Google
const GOOGLE_AGENTS_INSTRUCTIONS = {
  "CalendarAgent": `Você é o CalendarAgent. Seu papel é ajudar o usuário a criar eventos no Google Calendar.

1. Quando receber uma mensagem, verifique se já possui:
   • título (summary)
   • data/hora início (start)
   • data/hora fim (end)
   • lista de convidados (attendees, opcional)
   • descrição (optional)

2. Se faltar alguma informação, faça PERGUNTAS curtas em português até completar tudo.

3. Quando TUDO estiver preenchido, chame a tool create_event com os campos corretos.
   • Depois de chamar a tool, aguarde a resposta JSON.
   • Responda ao usuário em linguagem amigável, confirmando criação e mostrando link
     no formato: https://calendar.google.com/calendar/event?eid=<eventIdBase64>.

⚠️ Nunca invente dados. Jamais chame a tool sem validar datas.`,

  "SheetsAgent": `Você é o SheetsAgent. Objetivo: escrever ou ler dados em planilhas Google.

Fluxo:
1. Descubra se o usuário quer LER ou ESCREVER.
2. Colete: spreadsheetId (ou link), range (ex.: "Página1!A2:C2") e values
   (quando for escrita).
3. Valide se o range existe perguntando: "Você confirma que o intervalo
   'Página1!A2:C2' está correto?".
4. Chame sheet_write (ou sheet_read) conforme a operação.
5. Mostre resultado ao usuário em tabela markdown curta (máx 10 linhas).`,

  "DocsAgent": `Você é o DocsAgent. Cria ou atualiza documentos Google Docs.

1. Pergunte se o usuário quer criar novo doc ou atualizar existente (link/ID).
2. Para novo: peça título + conteúdo em Markdown.
3. Para update: peça Doc ID e trecho a ser alterado.
4. Chame doc_create ou doc_update.
5. Responda com link do documento: https://docs.google.com/document/d/<id>/edit
   e um resumo de 2 linhas do que foi feito.`
};

/**
 * Gerencia o envio de mensagens para um único modelo
 */
export const handleSingleModelMessage = async (
  content: string,
  mode: ChatMode,
  modelId: string,
  conversationId: string,
  messages: MessageType[],
  conversations: ConversationType[],
  files: string[] | undefined,
  params: LumaParams | undefined,
  conversationHistory: string | undefined,
  userId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  sendApiRequest: (
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams,
    enableStreaming?: boolean,
    streamListener?: (chunk: string) => void,
    conversationHistory?: string,
    userId?: string,
    systemPrompt?: string,
    availableTools?: any[]
  ) => Promise<ApiResponse>,
  saveMediaToGallery: (
    mediaUrl: string,
    prompt: string,
    mediaType: string,
    modelId: string,
    params?: LumaParams
  ) => Promise<any>,
  metadata?: Record<string, string>
) => {
  // Verificar se é um comando Google e obter o agente adequado
  const googleAgent = metadata?.googleAgent;
  const googleCommand = metadata?.googleCommand;

  // Instruções do sistema específicas para o agente Google, se aplicável
  let systemPrompt = undefined;
  let availableTools = undefined;

  if (googleAgent && GOOGLE_AGENTS_INSTRUCTIONS[googleAgent]) {
    systemPrompt = GOOGLE_AGENTS_INSTRUCTIONS[googleAgent];
    
    // Definir ferramentas disponíveis com base no agente
    if (googleAgent === "CalendarAgent") {
      availableTools = [
        {
          type: "function",
          function: {
            name: "create_event",
            description: "Cria um evento no Google Calendar do usuário.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Título do evento" },
                description: { type: "string" },
                start: { type: "string", format: "date-time" },
                end: { type: "string", format: "date-time" },
                attendees: {
                  type: "array",
                  items: { type: "string", format: "email" }
                }
              },
              required: ["summary", "start", "end"]
            }
          },
          endpoint: "/functions/v1/google/calendar/createEvent"
        }
      ];
    } else if (googleAgent === "SheetsAgent") {
      availableTools = [
        {
          type: "function",
          function: {
            name: "sheet_write",
            description: "Escreve dados em uma planilha Google Sheets.",
            parameters: {
              type: "object",
              properties: {
                spreadsheetId: { type: "string", description: "ID da planilha Google Sheets" },
                range: { type: "string", description: "Intervalo onde os dados serão escritos, ex: 'Sheet1!A1:B2'" },
                values: { 
                  type: "array", 
                  items: {
                    type: "array",
                    items: { type: "string" }
                  },
                  description: "Matriz de valores a serem escritos na planilha"
                }
              },
              required: ["spreadsheetId", "range", "values"]
            }
          },
          endpoint: "/functions/v1/google/sheets/write"
        }
      ];
    } else if (googleAgent === "DocsAgent") {
      availableTools = [
        {
          type: "function",
          function: {
            name: "doc_create",
            description: "Cria um novo documento Google Docs.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título do documento" },
                contentMarkdown: { type: "string", description: "Conteúdo do documento em formato markdown" }
              },
              required: ["title", "contentMarkdown"]
            }
          },
          endpoint: "/functions/v1/google/docs/create"
        }
      ];
    }
    
    console.log(`[singleModelHandler] Processando comando Google com ${googleAgent}`, {
      agent: googleAgent,
      command: googleCommand,
      hasTools: availableTools ? availableTools.length : 0
    });
  }

  // Adicionar mensagem de carregamento
  const loadingId = `loading-${modelId}-${uuidv4()}`;
  const loadingMessage = getLoadingMessage(mode, modelId);
  
  const loadingMsg: MessageType = {
    id: loadingId,
    content: loadingMessage,
    sender: 'assistant',
    timestamp: new Date().toISOString(),
    model: modelId,
    mode,
    loading: true
  };
  
  setMessages((prevMessages) => [...prevMessages, loadingMsg]);
  
  try {
    // Verificar se o modelo suporta streaming
    const supportsStreaming = modelSupportsStreaming(mode, modelId);
    
    if (supportsStreaming) {
      // Criar o ID da mensagem para streaming
      const messageId = uuidv4();
      
      // Substituir a mensagem de loading com uma mensagem de streaming
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(msg => msg.id !== loadingId);
        return [...filteredMessages, {
          id: messageId,
          content: '',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          streaming: true
        }];
      });
      
      // Preparar para iniciar o streaming
      let streamedContent = '';
      const streamListener = (chunk: string) => {
        streamedContent = chunk; // No streaming simulado, recebemos o conteúdo acumulado
        setMessages((prevMessages) => {
          return prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: streamedContent }
              : msg
          );
        });
      };
      
      // Enviar solicitação com suporte a streaming
      const streamResponse = await sendApiRequest(
        content, 
        mode, 
        modelId, 
        files, 
        params, 
        true, // indicar que queremos streaming
        streamListener,
        conversationHistory,
        userId,
        systemPrompt,
        availableTools
      );
      
      // Atualizar a mensagem final (remover flag de streaming)
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: streamedContent, streaming: false }
            : msg
        )
      );
      
      // Validate and convert the mode from response
      const validatedMode = validateChatMode(
        streamResponse.modeSwitch?.newMode || mode
      );
      
      // Salvar a mensagem final no banco de dados
      const finalMessage: MessageType = {
        id: messageId,
        content: streamedContent,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode: validatedMode,
        files: streamResponse.files,
        mediaUrl: streamResponse.files && streamResponse.files.length > 0 ? streamResponse.files[0] : undefined
      };
      
      await saveMessageToDatabase(finalMessage, conversationId);
      
      // Always save media to gallery if exists
      if (mode !== 'text' && 
          streamResponse.files && 
          streamResponse.files.length > 0) {
        try {
          await saveMediaToGallery(
            streamResponse.files[0],
            content,
            mode,
            modelId,
            params
          );
          console.log('[messageService] Media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
      
      return { 
        success: true, 
        error: null,
        modeSwitch: streamResponse.modeSwitch
      };
    } else {
      // Send request to API with appropriate timeout based on model
      const timeoutDuration = 
        (modelId === 'kligin-video' || modelId === 'luma-video') ? 300000 : // 5 minutes for video generation
        (modelId.includes('kligin') || modelId.includes('luma')) ? 180000 : // 3 minutes for other Kligin/Luma services
        180000; // 3 minutes default timeout
      
      console.log(`[singleModelHandler] Setting timeout of ${timeoutDuration/1000} seconds for ${modelId} request`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout exceeded")), timeoutDuration);
      });
      
      const responsePromise = sendApiRequest(
        content, 
        mode, 
        modelId, 
        files, 
        params,
        false,
        undefined,
        conversationHistory,
        userId,
        systemPrompt,
        availableTools
      );
      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      
      // Remove loading message
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingId)
      );
      
      console.log("API response received:", {
        mode,
        modelId,
        hasFiles: response.files && response.files.length > 0,
        firstFile: response.files && response.files.length > 0 ? response.files[0].substring(0, 30) + '...' : 'none',
        modeSwitch: response.modeSwitch ? 'detected' : 'none'
      });
      
      // Validate and convert the mode from response
      const validatedMode = validateChatMode(
        response.modeSwitch?.newMode || mode
      );
      
      // Add real response
      const newMessage: MessageType = {
        id: uuidv4(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode: validatedMode,
        files: response.files,
        mediaUrl: response.files && response.files.length > 0 ? response.files[0] : undefined
      };
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Save message in database
      await saveMessageToDatabase(newMessage, conversationId);
      
      // Always save media to gallery if exists - this ensures video persistency across refreshes
      if (mode !== 'text' && 
          response.files && 
          response.files.length > 0) {
        try {
          await saveMediaToGallery(
            response.files[0],
            content,
            mode,
            modelId,
            params
          );
          console.log('[messageService] Media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
      
      return { 
        success: true, 
        error: null,
        modeSwitch: response.modeSwitch
      };
    }
  } catch (err) {
    console.error("Error during request:", err);
    
    // Remove loading message
    setMessages((prevMessages) => 
      prevMessages.filter(msg => msg.id !== loadingId)
    );
    
    // Add specific error message based on mode and error
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    let friendlyError = `Ocorreu um erro ao processar sua solicitação. ${errorMsg}`;
    
    // Detectar erros específicos para mostrar melhores mensagens
    if (errorMsg.includes('tokens') || errorMsg.includes('Tokens') || errorMsg.includes('402') || errorMsg.includes('INSUFFICIENT_TOKENS')) {
      friendlyError = 'Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.';
    } else if (errorMsg.includes('API key') || errorMsg.includes('Authentication')) {
      friendlyError = 'Erro de autenticação na API. Verifique se a chave da API está configurada corretamente.';
    } else if (mode === 'video' && modelId.includes('luma')) {
      friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API do Luma está configurada corretamente.`;
    } else if (mode === 'image' && modelId.includes('luma')) {
      friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API do Luma está configurada corretamente.`;
    } else if (mode === 'video' && modelId.includes('kligin')) {
      friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API do Kligin está configurada corretamente.`;
    } else if (mode === 'image' && modelId.includes('kligin')) {
      friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API do Kligin está configurada corretamente.`;
    } else if (googleCommand) {
      friendlyError = `Erro ao processar comando do Google ${googleCommand}: ${errorMsg}. Verifique se sua conta Google está conectada e com as permissões adequadas.`;
    }
    
    const errorMessage: MessageType = {
      id: uuidv4(),
      content: friendlyError,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      model: modelId,
      mode,
      error: true
    };
    
    setMessages((prevMessages) => [...prevMessages, errorMessage]);
    
    // Save error message to database
    await saveMessageToDatabase(errorMessage, conversationId);
    
    throw err; // Re-throw to be caught by the outer catch
  }
};
