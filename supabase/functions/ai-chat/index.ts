
// Import necessary libraries and services
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { logError, logInfo } from "./utils/logging.ts";
import { validateRequest, validateApiKey } from "./utils/validation.ts";
import { updateTokenUsage, checkTokenAllowance } from "./utils/tokenManager.ts";

// Import model services
import { generateText as openaiGenerateText, generateImage as openaiGenerateImage, generateSpeech as openaiGenerateSpeech } from "./services/models/openai.ts";
import { generateText as anthropicGenerateText } from "./services/models/anthropic.ts";
import { generateText as geminiGenerateText } from "./services/models/gemini.ts";
import { generateSpeech as elevenlabsGenerateSpeech } from "./services/models/elevenlabs.ts";
import { generateImage as lumaGenerateImage, generateVideo as lumaGenerateVideo } from "./services/models/luma.ts";
import { generateText as deepseekGenerateText } from "./services/models/deepseek.ts";
import { generateImage as kliginGenerateImage, generateVideo as kliginGenerateVideo } from "./services/models/kligin.ts";
import { processUserMessage } from "./services/orchestrator.ts";

// Import mock service for testing
import { mockAiResponse } from "./services/models/mock.ts";

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate request
    const { content, mode, modelId, files, params, streaming, conversationHistory, userId } = await validateRequest(req);
    
    console.log(`[AI-Chat] Received request for model: ${modelId}, mode: ${mode}`);
    
    // For development/testing purposes when working with the mock endpoint
    if (modelId === "mock" || Deno.env.get("USE_MOCK_API") === "true") {
      const mockResponse = await mockAiResponse(content, mode, modelId);
      return new Response(JSON.stringify(mockResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Check token allowance if userId is provided
    if (userId) {
      const { allowed, message } = await checkTokenAllowance(userId);
      if (!allowed) {
        return new Response(
          JSON.stringify({ content: message, error: "INSUFFICIENT_TOKENS" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
    }
    
    // Use orchestrator to process the message first
    const orchestratorResult = await processUserMessage(
      content,
      userId,
      mode,
      modelId,
      conversationHistory
    );
    
    // Use enhanced prompt from orchestrator
    const enhancedContent = orchestratorResult.enhancedPrompt;
    
    // Variables for response tracking
    let responseContent = "";
    let mediaUrl = null;
    let modeSwitch = null;
    
    // Determine which provider and model to use
    if (mode === "text") {
      // Text generation
      if (modelId.startsWith("gpt-") || modelId === "gpt-4o" || modelId === "gpt-4o-mini" || modelId === "gpt-3.5-turbo" || modelId === "gpt-4.5-preview") {
        // OpenAI text models
        const response = await openaiGenerateText(enhancedContent, modelId, streaming);
        responseContent = response.content;
      } else if (modelId.startsWith("claude-")) {
        // Anthropic Claude models
        const response = await anthropicGenerateText(enhancedContent, modelId);
        responseContent = response.content;
      } else if (modelId.startsWith("gemini-")) {
        // Google Gemini models
        const response = await geminiGenerateText(enhancedContent, modelId);
        responseContent = response.content;
      } else if (modelId.startsWith("deepseek-")) {
        // DeepSeek models
        const response = await deepseekGenerateText(enhancedContent, modelId);
        responseContent = response.content;
      } else {
        throw new Error(`Unsupported text model: ${modelId}`);
      }
    } else if (mode === "image") {
      // Image generation
      if (modelId === "dall-e-3") {
        const response = await openaiGenerateImage(enhancedContent);
        responseContent = `Imagem gerada com sucesso usando ${modelId}.`;
        mediaUrl = response.url;
      } else if (modelId === "luma-image") {
        const response = await lumaGenerateImage(enhancedContent, params);
        responseContent = `Imagem gerada com sucesso usando Luma AI.`;
        mediaUrl = response.url;
      } else if (modelId === "kligin-image") {
        const response = await kliginGenerateImage(enhancedContent);
        if (response.success && response.data?.mediaUrl) {
          responseContent = `Imagem gerada com sucesso usando Kligin AI.`;
          mediaUrl = response.data.mediaUrl;
        } else {
          throw new Error(response.error || "Erro ao gerar imagem com Kligin");
        }
      } else {
        throw new Error(`Unsupported image model: ${modelId}`);
      }
    } else if (mode === "video") {
      // Video generation
      if (modelId === "luma-video") {
        const response = await lumaGenerateVideo(enhancedContent, params);
        responseContent = `Geração de vídeo iniciada com Luma AI. ${response.message || ""}`;
        mediaUrl = response.url;
      } else if (modelId === "kligin-video") {
        const response = await kliginGenerateVideo(enhancedContent);
        if (response.success) {
          if (response.data?.mediaUrl) {
            responseContent = `Vídeo gerado com sucesso usando Kligin AI.`;
            mediaUrl = response.data.mediaUrl;
          } else if (response.data?.taskId) {
            responseContent = `Geração de vídeo iniciada com Kligin AI. TaskID: ${response.data.taskId}. O processamento pode levar alguns minutos.`;
          }
        } else {
          throw new Error(response.error || "Erro ao gerar vídeo com Kligin");
        }
      } else {
        throw new Error(`Unsupported video model: ${modelId}`);
      }
    } else if (mode === "audio") {
      // Audio/speech generation
      if (modelId === "tts-1") {
        const response = await openaiGenerateSpeech(enhancedContent);
        responseContent = `Áudio gerado com sucesso usando OpenAI TTS.`;
        mediaUrl = response.url;
      } else if (modelId === "elevenlabs-tts") {
        const response = await elevenlabsGenerateSpeech(enhancedContent, "");
        responseContent = `Áudio gerado com sucesso usando ElevenLabs.`;
        mediaUrl = response.url;
      } else if (modelId === "kligin-tts") {
        responseContent = `Áudio não implementado para Kligin ainda.`;
      } else {
        throw new Error(`Unsupported audio model: ${modelId}`);
      }
    }
    
    // If orchestrator suggested a mode switch, add it to the response
    if (orchestratorResult.detectedMode !== mode || orchestratorResult.recommendedModel !== modelId) {
      modeSwitch = {
        newMode: orchestratorResult.detectedMode,
        newModel: orchestratorResult.recommendedModel
      };
      
      logInfo("MODE_SWITCH_DETECTED", {
        originalMode: mode,
        newMode: orchestratorResult.detectedMode,
        originalModel: modelId,
        newModel: orchestratorResult.recommendedModel
      });
    }
    
    // Update token usage if userId is provided
    if (userId) {
      await updateTokenUsage(userId, 1); // Use 1 as a simple count for now
    }
    
    // Prepare response
    const responseObject = {
      content: responseContent,
      files: mediaUrl ? [mediaUrl] : undefined,
      tokenInfo: {
        tokensUsed: 1,
        tokensRemaining: 999 // Placeholder value
      },
      modeSwitch
    };
    
    // Return the response
    return new Response(JSON.stringify(responseObject), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("[AI-Chat] Error:", error);
    
    // Log the error for tracking
    logError("AI_CHAT_ERROR", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return an error response
    return new Response(
      JSON.stringify({
        content: `Erro: ${error instanceof Error ? error.message : "Ocorreu um erro desconhecido."}`,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
