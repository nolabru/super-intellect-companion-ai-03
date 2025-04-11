
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  return null;
}

// Log errors with some context
function logError(type: string, details: any) {
  console.error(`[ERROR][${type}]`, JSON.stringify(details, null, 2));
}

async function generateTextWithGemini(content: string, model: string = 'gemini-1.5-flash') {
  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets');
    }

    console.log(`Generating text with Gemini model: ${model}`);

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: content
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    console.log('Gemini response received successfully');

    // Extract the generated text from response
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      content: generatedText,
      model: model
    };
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw error;
  }
}

// Main handler for Gemini chat requests
async function handleGeminiChat(req: Request): Promise<Response> {
  try {
    const { content, model } = await req.json();
    console.log(`Received request for Gemini model ${model || 'default'}`);
    
    if (!content) {
      return new Response(
        JSON.stringify({
          content: "Error: Missing required parameter 'content'",
          error: "MISSING_PARAMETER"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Default to gemini-1.5-flash if model is not specified
    const modelToUse = model || 'gemini-1.5-flash';
    
    // Available models for validation
    const availableModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-pro-vision'
    ];
    
    if (!availableModels.includes(modelToUse)) {
      return new Response(
        JSON.stringify({
          content: `Error: Model '${modelToUse}' is not supported. Available models: ${availableModels.join(', ')}`,
          error: "INVALID_MODEL"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    const response = await generateTextWithGemini(content, modelToUse);
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("GEMINI_ERROR", { error: errorMessage });
    
    return new Response(
      JSON.stringify({
        content: `Error processing request: ${errorMessage}`,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}

// Setup the server
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  
  // Handle API request
  return handleGeminiChat(req);
});
