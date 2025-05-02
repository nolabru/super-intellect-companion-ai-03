
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME");
    if (!APIFRAME_API_KEY) {
      throw new Error("API_FRAME is not configured");
    }
    
    // Test endpoints - updated with more endpoints to try
    const testEndpoints = [
      "https://api.apiframe.ai/v1/healthcheck",
      "https://api.apiframe.ai/healthcheck",
      "https://api.apiframe.com/v1/healthcheck",
      "https://api.apiframe.com/healthcheck",
      "https://api.apiframe.io/v1/healthcheck", 
      "https://api.apiframe.io/healthcheck",
      "https://api.apiformai.io/v1/healthcheck",
      "https://api.apiformai.io/healthcheck"
    ];
    
    console.log(`[apiframe-test-connection] Testing ${testEndpoints.length} endpoints with API key: ${APIFRAME_API_KEY.substring(0, 5)}...`);
    
    // Try each endpoint
    let working = false;
    let workingEndpoint = null;
    let allResponses = {};
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`[apiframe-test-connection] Testing endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });
        
        const responseText = await response.text();
        allResponses[endpoint] = {
          status: response.status,
          text: responseText
        };
        
        console.log(`[apiframe-test-connection] Response from ${endpoint}: ${response.status}`);
        
        if (response.ok) {
          working = true;
          workingEndpoint = endpoint;
          break;
        }
      } catch (err) {
        console.error(`[apiframe-test-connection] Error testing endpoint ${endpoint}:`, err);
        allResponses[endpoint] = {
          error: err.message
        };
      }
    }
    
    if (working) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "APIframe connection successful",
          endpoint: workingEndpoint
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not connect to any APIframe endpoint",
          details: allResponses
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('[apiframe-test-connection] Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
