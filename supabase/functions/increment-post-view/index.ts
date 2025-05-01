
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { post_id } = await req.json();
    
    if (!post_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing post_id parameter'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[increment-post-view] Incrementing view count for post: ${post_id}`);

    // Update the view_count for the post
    const { data, error } = await supabase.rpc('increment_counter', {
      row_id: post_id,
      increment_amount: 1
    });

    if (error) {
      console.error('[increment-post-view] Error incrementing view count:', error);
      throw error;
    }

    // Update the post with the new view count
    const { error: updateError } = await supabase
      .from('newsletter_posts')
      .update({ view_count: data || 1 })
      .eq('id', post_id);

    if (updateError) {
      console.error('[increment-post-view] Error updating post:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_count: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[increment-post-view] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
