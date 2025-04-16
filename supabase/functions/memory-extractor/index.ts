
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

// Configure CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Main function to analyze message content and extract memory items
async function extractMemoryItems(content: string) {
  try {
    // Using GPT to extract memory items
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    const prompt = `
    You are an AI assistant tasked with extracting and organizing important personal information from user messages.
    Please analyze the following message and identify any important details about the user that should be remembered for future conversations.
    
    Examples of important information:
    - Name or preferred way to be addressed
    - Personal preferences (e.g., favorite color, food, music)
    - Professional background
    - Location/Address information
    - Contact information
    - Important dates
    - Family information
    
    Message to analyze:
    "${content}"
    
    Return ONLY a JSON array of objects with the format:
    [
      {
        "key": "name", 
        "value": "John Doe",
        "title": "User's name"
      },
      {
        "key": "favorite_color",
        "value": "blue",
        "title": "Preferred color" 
      }
    ]
    
    The "title" field should be a brief human-readable description of what this memory represents.
    
    IMPORTANT: If no relevant information is found, return an empty array [].
    DO NOT invent or assume information not explicitly stated in the message.
    Only return the raw JSON array, no additional text.
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    let memoryItems;
    
    try {
      // Try to parse the content directly
      const content = data.choices[0].message.content.trim();
      memoryItems = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Fallback: Try to extract JSON using regex
      const jsonMatch = data.choices[0].message.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          memoryItems = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse JSON with regex fallback:', e);
          memoryItems = [];
        }
      } else {
        memoryItems = [];
      }
    }
    
    return memoryItems;
  } catch (error) {
    console.error('Error in memory extraction:', error);
    throw error;
  }
}

// Handler for the edge function
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  
  try {
    // Parse the request
    const { messageContent, userId } = await req.json();
    
    if (!messageContent || !userId) {
      return new Response(
        JSON.stringify({
          error: 'Both messageContent and userId are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract memory items
    const memoryItems = await extractMemoryItems(messageContent);
    
    // If there are memory items, store them in the database
    if (memoryItems && memoryItems.length > 0) {
      // Create a Supabase client for database operations
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase credentials not configured');
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Store each memory item
      for (const item of memoryItems) {
        await supabase
          .from('user_memory')
          .upsert({
            user_id: userId,
            key_name: item.key,
            value: item.value,
            source: 'auto-extracted',
            title: item.title || item.key.replace(/_/g, ' '),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,key_name'
          });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        memoryItems
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
