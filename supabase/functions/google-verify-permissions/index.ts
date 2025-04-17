
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter o token de acesso da solicitação
    const { accessToken } = await req.json()

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de acesso é obrigatório' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Verificar permissões para cada serviço relevante
    const services = [
      {
        name: 'Google Drive',
        url: 'https://www.googleapis.com/drive/v3/about?fields=user',
        scope: 'https://www.googleapis.com/auth/drive'
      },
      {
        name: 'Google Calendar',
        url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        scope: 'https://www.googleapis.com/auth/calendar'
      },
      {
        name: 'Google Sheets',
        url: 'https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        method: 'POST',
        body: JSON.stringify({
          properties: { title: 'Teste de Permissão' }
        })
      }
    ]

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await fetch(service.url, {
            method: service.method || 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: service.body
          })

          // Para o Google Sheets, excluir a planilha de teste se foi criada
          if (service.name === 'Google Sheets' && response.ok) {
            const data = await response.json()
            if (data.spreadsheetId) {
              try {
                await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  }
                })
              } catch (deleteError) {
                console.error('Erro ao excluir planilha de teste:', deleteError)
              }
            }
          }

          return {
            service: service.name,
            hasPermission: response.ok,
            scope: service.scope
          }
        } catch (error) {
          console.error(`Erro ao verificar permissão para ${service.name}:`, error)
          return {
            service: service.name,
            hasPermission: false,
            scope: service.scope,
            error: error.message
          }
        }
      })
    )

    // Verificar se o token ainda está válido (qualquer serviço respondeu com sucesso)
    const isValid = results.some(result => result.hasPermission)

    return new Response(
      JSON.stringify({
        success: isValid,
        services: results
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
