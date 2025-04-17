
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

// Define production URL
const SITE_URL = 'https://seu-site-de-producao.com';

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

    // Obter o código de autorização e informações da solicitação
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const state = url.searchParams.get('state')

    // Verificar se houve algum erro no processo OAuth
    if (error) {
      console.error('Erro durante o fluxo OAuth:', error)
      return Response.redirect(`${SITE_URL}/google-integrations?error=${error}`)
    }

    // Se não houver código, retornar erro
    if (!code) {
      console.error('Código de autorização ausente')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_code`)
    }

    // Decodificar estado para obter ID do usuário
    // O state deve ser definido no cliente ao iniciar o fluxo OAuth
    if (!state) {
      console.error('Estado ausente')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_state`)
    }

    let userId
    try {
      const decodedState = JSON.parse(atob(state))
      userId = decodedState.userId
    } catch (e) {
      console.error('Erro ao decodificar estado:', e)
      return Response.redirect(`${SITE_URL}/google-integrations?error=invalid_state`)
    }

    if (!userId) {
      console.error('ID do usuário ausente no estado')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_user_id`)
    }

    // Trocar o código por tokens
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const redirectUri = `${SITE_URL}/api/google-oauth-callback`
    
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Erro ao obter tokens:', errorData)
      return Response.redirect(`${SITE_URL}/google-integrations?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    // Salvar os tokens no banco de dados
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + tokenData.expires_in

    const { error: upsertError } = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Erro ao salvar tokens:', upsertError)
      return Response.redirect(`${SITE_URL}/google-integrations?error=db_save_failed`)
    }

    // Redirecionar de volta para a aplicação
    return Response.redirect(`${SITE_URL}/google-integrations?success=true`)
  } catch (error) {
    console.error('Erro ao processar callback OAuth:', error)
    
    // Retornar para a aplicação com erro
    return Response.redirect(`${SITE_URL}/google-integrations?error=server_error`)
  }
})
