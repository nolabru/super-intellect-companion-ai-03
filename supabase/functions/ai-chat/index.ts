
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateText } from "./services/models/openai.ts";
import { logError } from "./utils/logging.ts";
import {
  processUserMessage,
  extractAndSaveMemory,
  processGoogleIntegrationActions,
} from "./services/orchestrator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const {
      content,
      mode = 'text',
      modelId,
      userId,
      conversationId,
      conversationHistory,
      files,
      params,
    } = await req.json();

    // Validate inputs - ensuring we don't use validateRequest incorrectly
    if (!content) {
      throw new Error("Message content is required");
    }

    if (!modelId) {
      throw new Error("Model ID is required");
    }

    // Get most recent user message
    const userMessage = content;
    
    // Process user message through orchestrator
    const orchestratorResponse = await processUserMessage(
      userMessage,
      userId,
      mode,
      modelId,
      conversationHistory
    );
    
    console.log(`[ai-chat] Orchestrator processed message. Detected mode: ${orchestratorResponse.detectedMode}, recommended model: ${orchestratorResponse.recommendedModel}`);
    
    // Check if orchestrator detected a different mode
    const modeSwitch = mode !== orchestratorResponse.detectedMode ? {
      newMode: orchestratorResponse.detectedMode,
      newModel: orchestratorResponse.recommendedModel
    } : null;
    
    // Handle memory extraction if needed
    if (userId && orchestratorResponse.memoryExtracted) {
      await extractAndSaveMemory(userId, userMessage, orchestratorResponse);
    }
    
    // Handle Google integration actions if detected
    if (userId && orchestratorResponse.googleIntegrationActions && orchestratorResponse.googleIntegrationActions.length > 0) {
      console.log(`[ai-chat] Google integration actions detected: ${orchestratorResponse.googleIntegrationActions.length}`);
      
      const googleActionsResult = await processGoogleIntegrationActions(
        userId, 
        orchestratorResponse.googleIntegrationActions
      );
      
      if (googleActionsResult.needsMoreInfo) {
        // Return response asking for more information
        console.log(`[ai-chat] Google action needs more info, sending followup prompt`);
        return new Response(
          JSON.stringify({
            content: googleActionsResult.followupPrompt,
            mode: orchestratorResponse.detectedMode,
            model: modelId,
            modeSwitch: modeSwitch
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (googleActionsResult.success) {
        // Return success message with any results
        let responseContent = "Ação do Google concluída com sucesso. ";
        
        // Add links to created resources if available
        for (const result of googleActionsResult.results) {
          if (result.success) {
            if (result.actionType === 'calendar' && result.result.eventLink) {
              responseContent += `\n\nEvento criado: [Abrir no Google Calendar](${result.result.eventLink})`;
            } else if (result.actionType === 'drive' && result.result.documentLink) {
              responseContent += `\n\nDocumento criado: [Abrir no Google Drive](${result.result.documentLink})`;
            } else if (result.actionType === 'sheets' && result.result.spreadsheetLink) {
              responseContent += `\n\nPlanilha criada: [Abrir no Google Sheets](${result.result.spreadsheetLink})`;
            }
            
            // Add description of the action
            if (result.description) {
              responseContent += `\n- ${result.description}`;
            }
          }
        }
        
        return new Response(
          JSON.stringify({
            content: responseContent,
            mode: orchestratorResponse.detectedMode,
            model: modelId,
            modeSwitch: modeSwitch
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Check if we need to switch to Google service mode
    if (orchestratorResponse.detectedMode === 'google-service') {
      // Special handling for Google service mode
      const enhancedPrompt = orchestratorResponse.enhancedPrompt;
      
      // Return response to collect information
      return new Response(
        JSON.stringify({
          content: enhancedPrompt,
          mode: orchestratorResponse.detectedMode,
          model: modelId,
          modeSwitch: modeSwitch
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no special mode was detected, continue with normal processing
    let aiResponse: { content: string; } | null = null;

    if (modelId.startsWith("gpt-4o")) {
      aiResponse = await generateText(
        orchestratorResponse.enhancedPrompt,
        modelId
      );
    } else if (modelId.startsWith("claude-3")) {
      aiResponse = await generateText(
        orchestratorResponse.enhancedPrompt,
        modelId
      );
    } else {
      console.error(`Unsupported model: ${modelId}`);
      return new Response(
        JSON.stringify({
          content: "Modelo não suportado no momento.",
          mode: mode,
          model: modelId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Construct the response
    const data = {
      content: aiResponse.content,
      mode: mode,
      model: modelId,
      modeSwitch: modeSwitch
    };

    // Return the response
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    logError("AI_CHAT_ERROR", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
