
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { checkUserTokens } from "./utils/tokenManager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API keys from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const KLIGIN_API_KEY = Deno.env.get("KLIGIN_API_KEY");
const KLIGIN_API_SECRET = Deno.env.get("KLIGIN_API_SECRET");
const FIXED_KLIGIN_TOKEN = Deno.env.get("FIXED_KLIGIN_TOKEN");
const USE_FIXED_KLIGIN_TOKEN = Deno.env.get("USE_FIXED_KLIGIN_TOKEN") === "true";
const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY");

// Initialize the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Verificar se o body é válido e possui uma propriedade prompt
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("[ai-chat] Error parsing request JSON:", e);
      throw new Error("Invalid JSON in request body");
    }

    const { prompt, model = "gpt-4o", mode = "text", images = [], audio, video } = requestData;
    
    if (!prompt) {
      console.error("[ai-chat] No prompt provided in request data:", requestData);
      throw new Error("No prompt provided");
    }

    // Check if the user has enough tokens for this operation
    const { hasEnoughTokens, tokensRequired, tokensRemaining, error: tokenError } = 
      await checkUserTokens(user.id, model, mode);

    if (tokenError) {
      throw new Error(`Token check error: ${tokenError}`);
    }

    if (!hasEnoughTokens) {
      throw new Error(`Not enough tokens. This operation requires ${tokensRequired} tokens, but you have ${tokensRemaining} remaining.`);
    }
    
    console.log(`[ai-chat] Processing ${mode} prompt with model ${model}`);

    // Use OpenAI for chat completion
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let apiUrl = "https://api.openai.com/v1/chat/completions";
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    };

    // Build messages array
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that provides accurate and detailed answers."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // Handle images if in the right mode and model supports vision
    if (mode === "text" && images?.length > 0 && (model === "gpt-4o" || model === "gpt-4-vision-preview" || model === "gpt-4o-mini")) {
      const content = [
        { type: "text", text: prompt }
      ];

      // Add image URLs as content
      for (const imageUrl of images) {
        content.push({
          type: "image_url",
          image_url: { url: imageUrl }
        });
      }

      messages[1].content = content;
    }

    // Make the API request
    console.log("[ai-chat] Sending request to OpenAI API");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[ai-chat] API error:", error);
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    console.log("[ai-chat] Received successful response from OpenAI");
    
    // Return the response
    return new Response(
      JSON.stringify({ content: assistantResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ai-chat] Error processing request: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
