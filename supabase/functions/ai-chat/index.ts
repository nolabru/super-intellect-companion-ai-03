import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { logError } from "./utils/logging.ts";

// Import model services
import * as lumaService from "./services/models/luma.ts";
import * as mockService from "./services/models/mock.ts";
import * as openaiService from "./services/models/openai.ts";
import * as anthropicService from "./services/models/anthropic.ts";
import * as elevenlabsService from "./services/models/elevenlabs.ts";

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
}

// Token mocado para testes com a Luma API - usando o token fornecido pelo usuário
const MOCKED_LUMA_TOKEN = "luma-d0412b33-742d-4c23-bea2-cf7a8e2af184-ef7762ab-c1c6-4e73-b6d4-42078e8c7775";

// Main handler for all AI chat requests
async function handleAIChat(req: Request): Promise<Response> {
  try {
    const { content, mode, modelId, files, params } = await req.json();
    console.log(`Received request for model ${modelId} in mode ${mode}`, {
      contentLength: content?.length,
      filesCount: files?.length,
      paramsPreview: params ? JSON.stringify(params).substring(0, 100) : 'none'
    });
    
    let response: ResponseData = {
      content: "Not able to process your request."
    };
    
    // Process based on model and mode
    try {
      // Verification specific for Luma models
      if (modelId.includes("luma")) {
        // Using token mocado for Luma
        console.log("Luma model selected, using mocked token configured directly in code");
        // Pre-configured LUMA_TOKEN_MOCK variable in service
        lumaService.setMockedToken(MOCKED_LUMA_TOKEN);
        
        // Optional validation to check if the token works
        const isValid = await lumaService.testApiKey(MOCKED_LUMA_TOKEN);
        if (!isValid) {
          console.warn("The mocked Luma token may not be working correctly");
        }
      }
      
      // Special check for OpenAI models
      if (modelId.includes("gpt")) {
        try {
          // Verify OpenAI API key before proceeding
          openaiService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "OPENAI_API_KEY not configured",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
      
      // Special check for Anthropic models
      if (modelId.includes("claude")) {
        try {
          // Verify Anthropic API key before proceeding
          anthropicService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "ANTHROPIC_API_KEY not configured",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
      
      // Verification for ElevenLabs
      if (modelId.includes("eleven")) {
        try {
          // Verify the ElevenLabs API key before proceeding
          elevenlabsService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "ELEVENLABS_API_KEY not configured",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
      
      // Google Gemini models integration
      if (modelId.includes("gemini") && mode === "text") {
        console.log("Starting Gemini text processing");
        
        try {
          // Call the Gemini edge function
          const { data: geminiData, error: geminiError } = await fetch(
            `${req.url.split('/ai-chat')[0]}/gemini-chat`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || ''
              },
              body: JSON.stringify({
                content,
                model: modelId
              })
            }
          ).then(res => res.json());
          
          if (geminiError) {
            throw new Error(`Gemini API error: ${geminiError}`);
          }
          
          response = {
            content: geminiData.content
          };
          
          console.log("Gemini text processing completed successfully");
        } catch (error) {
          throw new Error(`Error processing Gemini request: ${error.message}`);
        }
      }
      
      // Luma AI models
      else if (modelId === "luma-video" && mode === "video") {
        console.log("Starting Luma AI video processing");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        
        // If no parameters are defined, use default values for the Luma model
        const videoParams = {
          ...params,
          model: params?.model || "ray-2"
        };
        
        // Use AbortController to limit the total processing time
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Global video processing time limit reached (5 minutes)");
          controller.abort();
        }, 300000); // 5 minutes
        
        try {
          response = await Promise.race([
            lumaService.generateVideo(content, videoParams, imageUrl),
            new Promise<ResponseData>((_, reject) => {
              // If the AbortController is triggered, this Promise will reject
              controller.signal.addEventListener('abort', () => {
                reject(new Error("Global video processing time limit exceeded (5 minutes)"));
              });
            })
          ]);
          clearTimeout(timeoutId);
          console.log("Video processing completed successfully");
          
          // Add timestamp to the video URL to avoid caching
          if (response.files && response.files.length > 0) {
            response.files[0] = addTimestampToUrl(response.files[0]);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } 
      else if (modelId === "luma-image" && mode === "image") {
        console.log("Starting Luma AI image processing");
        
        // If no parameters are defined, use default values for the Luma model
        const imageParams = {
          ...params,
          model: params?.model || "luma-1.1"
        };
        
        response = await lumaService.generateImage(content, imageParams);
        console.log("Image processing completed successfully");
        
        // Add timestamp to the image URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      
      // OpenAI models
      else if (modelId.includes("gpt") && mode === "text") {
        console.log("Starting OpenAI text processing");
        response = await openaiService.generateText(content, modelId);
        console.log("Text processing completed successfully");
      }
      else if (modelId.includes("gpt") && mode === "image" && files && files.length > 0) {
        console.log("Starting OpenAI image analysis processing");
        const imageUrl = files[0];
        response = await openaiService.processImage(content, imageUrl, modelId);
        console.log("Image analysis completed successfully");
      }
      else if (modelId.includes("gpt") && mode === "image" && (!files || files.length === 0)) {
        console.log("Starting DALL-E image generation via OpenAI");
        response = await openaiService.generateImage(content, "dall-e-3");
        console.log("Image generation completed successfully");
        
        // Add timestamp to the image URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      
      // Anthropic models
      else if (modelId.includes("claude") && mode === "text") {
        console.log("Starting Anthropic text processing");
        response = await anthropicService.generateText(content, modelId);
        console.log("Text processing completed successfully");
      }
      else if (modelId.includes("claude") && mode === "image") {
        console.log("Starting Anthropic image processing");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        if (imageUrl) {
          response = await anthropicService.processImage(content, imageUrl, modelId);
        } else {
          response = { content: "Error: Image analysis requires an image." };
        }
      }
      
      // ElevenLabs models
      else if (modelId === "eleven-labs" && mode === "audio") {
        console.log("Starting ElevenLabs audio generation");
        // Extracting parameters
        const voiceParams = {
          voiceId: params?.voiceId || "EXAVITQu4vr4xnSDxMaL", // Sarah by default
          model: params?.model || "eleven_multilingual_v2",
          stability: params?.stability || 0.5,
          similarityBoost: params?.similarityBoost || 0.75,
          style: params?.style || 0,
          speakerBoost: params?.speakerBoost || true
        };
        
        response = await elevenlabsService.generateSpeech(content, voiceParams);
        console.log("Audio generation completed successfully");
        
        // Add timestamp to the audio URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      
      // Simulation for other models
      else if (modelId.includes("ideogram") && mode === "image") {
        response = mockService.generateImage(content, "Ideogram");
        
        // Add timestamp to the image URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      } 
      else if (modelId.includes("kligin") && mode === "image") {
        response = mockService.generateImage(content, "Kligin AI");
        
        // Add timestamp to the image URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      else if (modelId.includes("kligin") && mode === "video") {
        response = mockService.generateVideo(content, "Kligin AI");
        
        // Add timestamp to the video URL to avoid caching
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      else {
        // Default mock response for any other model/mode
        response = mockService.generateText(content, modelId, mode);
      }
      
      // Log the results
      console.log(`Response from model ${modelId} in mode ${mode} generated successfully:`, {
        hasFiles: response.files && response.files.length > 0,
        fileCount: response.files?.length || 0,
        contentLength: response.content?.length || 0
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError("SERVICE_ERROR", { error: errorMessage, model: modelId, mode });
      
      let friendlyError = `Error processing request: ${errorMessage}`;
      
      // Specific error messages
      if (modelId.includes("luma")) {
        if (errorMessage.includes("API key") || errorMessage.includes("Authorization") || errorMessage.includes("authenticate")) {
          friendlyError = "Configuration error: Luma AI API key is not configured correctly. Please check your settings.";
        } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          friendlyError = "Luma API Error: Endpoint not found. The API may have been updated.";
        } else if (errorMessage.includes("Tempo limite")) {
          friendlyError = `Video/image processing exceeded the global time limit. The generation may be ongoing on the Luma AI server, check your Luma AI dashboard.`;
        } else {
          friendlyError = `Luma AI image/video generation error: ${errorMessage}`;
        }
      } else if (modelId.includes("eleven")) {
        if (errorMessage.includes("API key") || errorMessage.includes("xi-api-key") || errorMessage.includes("authenticate")) {
          friendlyError = "Configuration error: ElevenLabs API key is not configured correctly. Please check your settings.";
        } else {
          friendlyError = `Audio generation error with ElevenLabs: ${errorMessage}`;
        }
      } else if (modelId.includes("gemini")) {
        if (errorMessage.includes("API key") || errorMessage.includes("credential") || errorMessage.includes("authenticate")) {
          friendlyError = "Configuration error: Google Gemini API key is not configured correctly. Please check your settings.";
        } else {
          friendlyError = `Google Gemini text generation error: ${errorMessage}`;
        }
      }
      
      return new Response(
        JSON.stringify({
          content: friendlyError,
          error: errorMessage,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("REQUEST_ERROR", { error: errorMessage });
    
    return new Response(
      JSON.stringify({
        content: `Error: ${errorMessage}`,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Helper function to add timestamp to URLs for cache busting
function addTimestampToUrl(url: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

// Setup the server
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  
  // Handle API request
  return handleAIChat(req);
});
