
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
    
    // Parse request body to get action
    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    
    const action = body.action || 'balance';
    
    // Get token balance
    if (action === 'balance') {
      // First check if there are multiple records for this user
      const { data: existingTokens, error: countError } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', userId);
        
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
        console.log(`Found ${existingTokens.length} token records for user ${userId}. Consolidating...`);
        
        // Get full data of all records
        const { data: fullTokenData, error: fullDataError } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', userId);
        
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
        const totalRemainingTokens = fullTokenData.reduce((sum, record) => sum + (record.tokens_remaining || 0), 0);
        const totalUsedTokens = fullTokenData.reduce((sum, record) => sum + (record.tokens_used || 0), 0);
        
        // Find the most recent reset date
        let latestResetDate = null;
        for (const record of fullTokenData) {
          if (record.next_reset_date) {
            if (!latestResetDate || new Date(record.next_reset_date) > new Date(latestResetDate)) {
              latestResetDate = record.next_reset_date;
            }
          }
        }
        
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
        
        // Update the remaining record with consolidated data
        const { data: updatedData, error: updateError } = await supabase
          .from('user_tokens')
          .update({
            tokens_remaining: totalRemainingTokens,
            tokens_used: totalUsedTokens,
            next_reset_date: latestResetDate,
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
          JSON.stringify({ tokens: updatedData[0], consolidated: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Standard case - try to get the single record
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('tokens_remaining, tokens_used, next_reset_date')
        .eq('user_id', userId)
        .single();
      
      if (tokenError) {
        console.log("Token query error:", tokenError);
        
        // If no record exists, create one
        if (tokenError.code === 'PGRST116') {
          console.log("Multiple records found, should not happen after cleanup");
          return new Response(
            JSON.stringify({ error: "Inconsistent token records found" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else if (tokenError.code === 'PGRST104') {
          // No record found, create one
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
        } else {
          return new Response(
            JSON.stringify({ error: "Failed to retrieve token balance" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
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
