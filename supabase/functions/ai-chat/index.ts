
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock das chamadas de API (posteriormente serão substituídas pelas chamadas reais)
async function callOpenAI(prompt: string, model: string) {
  console.log(`Chamando OpenAI com modelo ${model}, prompt: ${prompt}`);
  // Simular uma resposta
  return {
    content: `Resposta do ${model} para: "${prompt}"\n\nEste é um texto gerado como exemplo para o modelo ${model}.`,
    model: model
  };
}

async function callAnthropic(prompt: string, model: string) {
  console.log(`Chamando Anthropic com modelo ${model}, prompt: ${prompt}`);
  // Simular uma resposta
  return {
    content: `Resposta do ${model} para: "${prompt}"\n\nEste é um texto gerado como exemplo para o modelo ${model}.`,
    model: model
  };
}

async function callGemini(prompt: string, model: string) {
  console.log(`Chamando Gemini com modelo ${model}, prompt: ${prompt}`);
  // Simular uma resposta
  return {
    content: `Resposta do ${model} para: "${prompt}"\n\nEste é um texto gerado como exemplo para o modelo ${model}.`,
    model: model
  };
}

async function callLlama(prompt: string, model: string) {
  console.log(`Chamando Llama com modelo ${model}, prompt: ${prompt}`);
  // Simular uma resposta
  return {
    content: `Resposta do ${model} para: "${prompt}"\n\nEste é um texto gerado como exemplo para o modelo ${model}.`,
    model: model
  };
}

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter parâmetros da requisição
    const { prompt, model, mode, conversationId } = await req.json();
    
    if (!prompt || !model || !mode) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determinar qual API chamar com base no modelo
    let response;
    if (model.startsWith('gpt-') || model.includes('openai')) {
      response = await callOpenAI(prompt, model);
    } else if (model.includes('claude')) {
      response = await callAnthropic(prompt, model);
    } else if (model.includes('gemini')) {
      response = await callGemini(prompt, model);
    } else if (model.includes('llama')) {
      response = await callLlama(prompt, model);
    } else {
      return new Response(
        JSON.stringify({ error: 'Modelo não suportado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Se um conversationId foi fornecido, salvar a mensagem no Supabase
    if (conversationId) {
      // Criar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vygluorjwehcdigzxbaa.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Salvar a mensagem do usuário e a resposta do modelo
      try {
        // Primeiro, salvar a mensagem do usuário
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: prompt,
          sender: 'user',
          model: 'user',
          mode: mode
        });

        // Depois, salvar a resposta do modelo
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: response.content,
          sender: 'ai',
          model: model,
          mode: mode
        });
      } catch (error) {
        console.error('Erro ao salvar mensagens:', error);
      }
    }

    // Retornar a resposta
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro no servidor:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
