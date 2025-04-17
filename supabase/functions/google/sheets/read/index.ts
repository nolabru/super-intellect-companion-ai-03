
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inicializar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuração necessária para API do Google
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extrair parâmetros da requisição
    const { spreadsheetId, range, userId } = await req.json()
    
    if (!userId) {
      throw new Error('ID do usuário é obrigatório')
    }

    if (!spreadsheetId || !range) {
      throw new Error('Parâmetros incompletos: spreadsheetId e range são obrigatórios')
    }

    // Buscar tokens do Google para o usuário
    const { data: tokens, error: tokensError } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single()

    if (tokensError || !tokens) {
      console.error('Erro ao buscar tokens:', tokensError)
      throw new Error('Usuário não conectado ao Google ou tokens não encontrados')
    }

    // Verificar se o token expirou
    const now = Math.floor(Date.now() / 1000)
    let accessToken = tokens.access_token

    if (tokens.expires_at < now) {
      // Renovar token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()
      
      if (!refreshResponse.ok) {
        console.error('Erro ao renovar token:', refreshData)
        throw new Error('Falha ao renovar token do Google')
      }

      accessToken = refreshData.access_token
      
      // Atualizar token no banco
      await supabase
        .from('user_google_tokens')
        .update({
          access_token: refreshData.access_token,
          expires_at: now + refreshData.expires_in,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    // Chamar API do Google Sheets
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.text()
      console.error('Erro na API do Google Sheets:', errorData)
      throw new Error(`Erro ao ler da planilha: ${sheetsResponse.status}`)
    }

    const sheetsData = await sheetsResponse.json()
    
    // Obter URL da planilha
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    
    return new Response(
      JSON.stringify({
        success: true,
        values: sheetsData.values,
        range: sheetsData.range,
        spreadsheetUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro ao processar solicitação:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
