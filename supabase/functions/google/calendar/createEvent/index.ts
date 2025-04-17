
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
    const { summary, description, start, end, attendees, userId } = await req.json()
    
    if (!userId) {
      throw new Error('ID do usuário é obrigatório')
    }

    if (!summary || !start || !end) {
      throw new Error('Parâmetros incompletos: summary, start e end são obrigatórios')
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

    // Preparar evento para o Google Calendar
    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'America/Sao_Paulo', // Usar timezone do Brasil como padrão
      },
      end: {
        dateTime: end,
        timeZone: 'America/Sao_Paulo',
      },
    }

    // Adicionar convidados se fornecidos
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      event.attendees = attendees.map(email => ({ email }))
    }

    // Chamar API do Google Calendar
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.text()
      console.error('Erro na API do Google Calendar:', errorData)
      throw new Error(`Erro ao criar evento: ${calendarResponse.status}`)
    }

    const calendarData = await calendarResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        eventId: calendarData.id,
        link: calendarData.htmlLink,
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
