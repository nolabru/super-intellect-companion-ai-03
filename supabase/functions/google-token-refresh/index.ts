
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google OAuth credentials
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se as credenciais do Google estão configuradas
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Credenciais do Google não configuradas no servidor'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Obter o token de atualização da solicitação
    const { userId, refreshToken } = await req.json()

    if (!userId || !refreshToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UserId e RefreshToken são obrigatórios' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Autenticar usuário pelo ID
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('Erro ao verificar usuário:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado ou não autorizado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Solicitar novo token de acesso ao Google
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro na resposta do Google:', errorData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha ao renovar o token: ' + errorData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      )
    }

    const tokenData: TokenResponse = await response.json()
    
    // Calcular a data de expiração
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + tokenData.expires_in
    
    // Atualizar tokens no banco de dados
    const { error: updateError } = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // manter o refresh token antigo se não receber um novo
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error('Erro ao atualizar tokens:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao atualizar tokens no banco de dados' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Retornar tokens renovados
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token, // pode ser undefined
        expiresAt: expiresAt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erro ao processar solicitação:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
