
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

    // First check if there are multiple records for this user
    const { data: existingTokens, error: countError } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('user_id', targetUser.id);
      
    if (countError) {
      console.error("Error checking existing tokens:", countError);
      return new Response(
        JSON.stringify({ error: "Error checking token records" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // If multiple records exist, clean them up and create a single unified record
    if (existingTokens && existingTokens.length > 1) {
      console.log(`Found ${existingTokens.length} token records for user ${targetUser.id}. Cleaning up...`);
      
      // Get full data of all records
      const { data: fullTokenData, error: fullDataError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', targetUser.id);
      
      if (fullDataError || !fullTokenData) {
        console.error("Error fetching full token data:", fullDataError);
        return new Response(
          JSON.stringify({ error: "Error fetching token records" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Calculate total tokens from all records
      const totalExistingTokens = fullTokenData.reduce((sum, record) => sum + (record.tokens_remaining || 0), 0);
      const totalUsedTokens = fullTokenData.reduce((sum, record) => sum + (record.tokens_used || 0), 0);
      
      // Delete all records except the oldest one
      const sortedRecords = fullTokenData.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const oldestRecord = sortedRecords[0];
      const recordsToDelete = sortedRecords.slice(1).map(r => r.id);
      
      // Delete the extra records
      if (recordsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_tokens')
          .delete()
          .in('id', recordsToDelete);
          
        if (deleteError) {
          console.error("Error deleting duplicate records:", deleteError);
          return new Response(
            JSON.stringify({ error: "Error cleaning up duplicate token records" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
      
      // Update the remaining record with the new token amount and combined used tokens
      const { data: updatedData, error: updateError } = await supabase
        .from('user_tokens')
        .update({
          tokens_remaining: tokens, // Set to the new amount specified by admin
          tokens_used: totalUsedTokens,
          updated_at: new Date().toISOString()
        })
        .eq('id', oldestRecord.id)
        .select();
      
      if (updateError) {
        console.error("Error updating consolidated token record:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update token record after consolidation" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Successfully consolidated and updated token balance for user ${email} to ${tokens} tokens`,
          data: updatedData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // If only one or no records exist, proceed with normal update/insert logic
    // Try to update the existing record
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
      if (updateError.code === 'PGRST116' || !existingTokens || existingTokens.length === 0) {
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
