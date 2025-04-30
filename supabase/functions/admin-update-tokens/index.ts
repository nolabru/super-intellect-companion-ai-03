
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

  try {
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
    
    // Verify if the authenticated user is an admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData || !profileData.is_admin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { email, tokens } = requestBody;

    if (!email || !tokens) {
      return new Response(
        JSON.stringify({ error: "Email and tokens amount are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the user by email
    const { data: userData, error: findUserError } = await supabase.auth.admin.listUsers();
    
    if (findUserError) {
      console.error("Error listing users:", findUserError);
      return new Response(
        JSON.stringify({ error: "Error retrieving users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the user with the matching email
    const targetUser = userData.users.find(u => u.email === email);
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "User not found with the provided email" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the user's tokens
    const { data: tokenData, error: updateError } = await supabase
      .from('user_tokens')
      .update({
        tokens_remaining: tokens,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUser.id)
      .select();
      
    if (updateError) {
      console.error("Error updating tokens:", updateError);
      
      // If no record exists, create one
      if (updateError.code === 'PGRST116') {
        const { data: newTokenData, error: insertError } = await supabase
          .from('user_tokens')
          .insert([{ 
            user_id: targetUser.id,
            tokens_remaining: tokens
          }])
          .select();
          
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
            success: true,
            message: `Created new token record for user ${email} with ${tokens} tokens`,
            data: newTokenData
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to update token balance" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully updated token balance for user ${email} to ${tokens} tokens`,
        data: tokenData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
