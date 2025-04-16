
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Error retrieving user:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const userId = user.id;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Get token balance
    if (action === 'balance' || !action) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('tokens_remaining, tokens_used, next_reset_date')
        .eq('user_id', userId)
        .single();
      
      if (tokenError) {
        console.error("Error retrieving token balance:", tokenError);
        
        // If no record exists, create one
        if (tokenError.code === 'PGRST116') {
          const { data: newTokenData, error: insertError } = await supabase
            .from('user_tokens')
            .insert([{ user_id: userId }])
            .select()
            .single();
          
          if (insertError) {
            return new Response(
              JSON.stringify({ error: "Failed to create token record" }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              tokens: newTokenData,
              created: true
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "Failed to retrieve token balance" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ tokens: tokenData }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } 
    // Get token consumption rates
    else if (action === 'rates') {
      const { data: ratesData, error: ratesError } = await supabase
        .from('token_consumption_rates')
        .select('model_id, mode, tokens_per_request')
        .order('tokens_per_request', { ascending: false });
      
      if (ratesError) {
        console.error("Error retrieving token rates:", ratesError);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve token rates" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ rates: ratesData }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
