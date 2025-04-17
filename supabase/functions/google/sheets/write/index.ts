
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://googleapis.deno.dev/v1/sheets:v4.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { user_id, spreadsheetId, range, values } = await req.json();

    if (!user_id || !spreadsheetId || !range || !values) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Buscar tokens
    const { data, error } = await supabaseClient
      .from("user_google_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user_id)
      .single();

    if (error) {
      console.error("Erro ao buscar tokens:", error);
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar os tokens do Google", details: error.message }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Instanciar cliente Sheets
    const sheets = createClient({
      auth: {
        type: "authorized_user",
        client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
        refresh_token: data.refresh_token,
        access_token: data.access_token,
      },
    });

    // 3. Escrever na planilha
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    const sheetLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return new Response(
      JSON.stringify({ 
        updatedCells: res.data.updatedCells,
        sheetLink,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Erro ao escrever na planilha:", error);
    return new Response(
      JSON.stringify({ 
        error: "Falha ao escrever no Google Sheets", 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
