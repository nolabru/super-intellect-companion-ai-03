
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { checkUserTokens } from "./utils/tokenManager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize the OpenAI API key from environment variable
const KLIGIN_API_KEY = Deno.env.get("KLIGIN_API_KEY");
const KLIGIN_API_SECRET = Deno.env.get("KLIGIN_API_SECRET");
const FIXED_KLIGIN_TOKEN = Deno.env.get("FIXED_KLIGIN_TOKEN");
const USE_FIXED_KLIGIN_TOKEN = Deno.env.get("USE_FIXED_KLIGIN_TOKEN") === "true";
const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY");

// Initialize the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize the API Frame key
const API_FRAME = Deno.env.get("API_FRAME");

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

    const { prompt, model = "gpt-4o", mode = "text", images = [], audio, video } = await req.json();
    
    if (!prompt) {
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
    
    console.log(`Processing ${mode} prompt with model ${model}`);

    // Placeholder for actual AI call - in a real implementation, this would call the AI API
    const responseContent = `This is a simulated response for your prompt: "${prompt}"`;
    
    return new Response(
      JSON.stringify({ content: responseContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error processing request: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
