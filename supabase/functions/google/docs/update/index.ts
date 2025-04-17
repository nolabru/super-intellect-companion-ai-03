
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

// Função auxiliar para converter markdown para documento estruturado
function convertMarkdownToGoogleDocsRequests(markdown: string) {
  // Esta é uma implementação simplificada
  // Para uma versão completa, seria necessário limpar o documento primeiro
  const requests = [
    // Limpar todo o conteúdo do documento
    {
      deleteContentRange: {
        range: {
          startIndex: 1, // Começar do índice 1 para preservar o início do documento
          endIndex: 999999 // Um número grande para cobrir todo o documento
        }
      }
    }
  ];
  
  // Dividir o texto em parágrafos
  const paragraphs = markdown.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().startsWith('# ')) {
      // Cabeçalho H1
      requests.push({
        insertText: {
          text: paragraph.replace('# ', ''),
          endOfSegmentLocation: {}
        }
      });
      requests.push({
        updateParagraphStyle: {
          paragraphStyle: {
            namedStyleType: 'HEADING_1'
          },
          fields: 'namedStyleType',
          range: {
            endIndex: -1,
            segmentId: ''
          }
        }
      });
    } else if (paragraph.trim().startsWith('## ')) {
      // Cabeçalho H2
      requests.push({
        insertText: {
          text: paragraph.replace('## ', ''),
          endOfSegmentLocation: {}
        }
      });
      requests.push({
        updateParagraphStyle: {
          paragraphStyle: {
            namedStyleType: 'HEADING_2'
          },
          fields: 'namedStyleType',
          range: {
            endIndex: -1,
            segmentId: ''
          }
        }
      });
    } else {
      // Parágrafo normal
      requests.push({
        insertText: {
          text: paragraph,
          endOfSegmentLocation: {}
        }
      });
    }
    
    // Adicionar quebra de linha após cada parágrafo
    requests.push({
      insertText: {
        text: '\n',
        endOfSegmentLocation: {}
      }
    });
  }
  
  return requests;
}

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extrair parâmetros da requisição
    const { documentId, contentMarkdown, userId } = await req.json()
    
    if (!userId) {
      throw new Error('ID do usuário é obrigatório')
    }

    if (!documentId || !contentMarkdown) {
      throw new Error('Parâmetros incompletos: documentId e contentMarkdown são obrigatórios')
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

    // Verificar se o documento existe e o usuário tem acesso
    const getDocResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!getDocResponse.ok) {
      console.error('Erro ao verificar documento:', getDocResponse.status)
      throw new Error(`Documento não encontrado ou sem permissão de acesso: ${getDocResponse.status}`)
    }

    // Atualizar o conteúdo do documento
    const updateRequest = {
      requests: convertMarkdownToGoogleDocsRequests(contentMarkdown),
    }

    const updateDocResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateRequest),
    })

    if (!updateDocResponse.ok) {
      const errorData = await updateDocResponse.text()
      console.error('Erro na API do Google Docs (atualização):', errorData)
      throw new Error(`Erro ao atualizar conteúdo do documento: ${updateDocResponse.status}`)
    }

    // Obter URL do documento
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`
    
    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        documentUrl,
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
