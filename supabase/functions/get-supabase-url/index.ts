
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Cabeçalhos CORS para permitir acesso de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Tratar requisições de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!supabaseUrl) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_URL not configured in environment variables' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ url: supabaseUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
