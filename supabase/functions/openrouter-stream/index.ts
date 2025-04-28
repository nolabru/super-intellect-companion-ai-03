
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { params, apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!params || !params.messages || !params.model) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters. Required: model and messages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Prepare request payload with stream: true
    const requestPayload = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens,
      top_p: params.top_p ?? 1,
      frequency_penalty: params.frequency_penalty ?? 0,
      presence_penalty: params.presence_penalty ?? 0,
      stream: true,
      response_format: { type: "text" }
    };

    console.log(`Streaming from OpenRouter with model: ${params.model}`);

    const openRouterResponse = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://lovable.ai',
        'X-Title': 'Lovable AI'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', openRouterResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ error: `OpenRouter API error: ${openRouterResponse.status} ${errorText}` }),
        { status: openRouterResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream to pass through the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Pipe the OpenRouter stream directly to our response
    (async () => {
      try {
        const reader = openRouterResponse.body?.getReader();
        if (!reader) {
          writer.close();
          return;
        }

        const encoder = new TextEncoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Pass through the chunk directly
          await writer.write(value);
        }
      } catch (error) {
        console.error('Error streaming from OpenRouter:', error);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in openrouter-stream function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
