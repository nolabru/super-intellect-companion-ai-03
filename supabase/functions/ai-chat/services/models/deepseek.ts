
// Import the necessary modules for HTTP requests
import { validateApiKey } from "../../utils/validation.ts";
import { fetchWithRetry } from "../../utils/logging.ts";

export async function generateText(content: string, modelId: string): Promise<{ content: string }> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  try {
    let model: string;
    switch (modelId) {
      case 'deepseek-chat':
        model = 'deepseek-chat';
        break;
      case 'deepseek-coder':
        model = 'deepseek-coder';
        break;
      default:
        throw new Error(`Unsupported Deepseek model: ${modelId}`);
    }

    console.log(`Calling Deepseek API with model: ${model} and API key starting with: ${apiKey.substring(0, 5)}...`);
    console.log(`Request payload: ${JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: content.substring(0, 50) + (content.length > 50 ? '...' : '') }
      ]
    }, null, 2)}`);
    
    // Using direct HTTP requests as per official Deepseek API documentation
    // Reference: https://platform.deepseek.com/api-reference
    const response = await fetchWithRetry(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: content }
          ]
        })
      },
      3, // max retries
      1000 // initial delay in ms
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Deepseek API Error (${response.status}):`, errorText);
      
      // Handle specific error cases based on the response
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid Deepseek API key');
      } else if (response.status === 402) {
        throw new Error('Billing issue: Insufficient account balance or payment required');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded: Too many requests to the Deepseek API');
      } else {
        throw new Error(`Deepseek API returned status ${response.status}: ${errorText}`);
      }
    }

    console.log("Deepseek API response received successfully");
    const data = await response.json();
    
    // Log response structure for debugging
    console.log(`Response structure: ${JSON.stringify({
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices_count: data.choices?.length || 0
    }, null, 2)}`);
    
    if (!data.choices || data.choices.length === 0) {
      console.error("No choices returned in Deepseek response");
      throw new Error("Deepseek API returned no choices in response");
    }
    
    return {
      content: data.choices[0].message.content || 'No response generated.'
    };
  } catch (error) {
    console.error('Deepseek API Error:', error);
    throw new Error(`Deepseek API request failed: ${error.message}`);
  }
}

export function verifyApiKey(): void {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  
  // Validate API key format - Deepseek typically uses a "sk-" prefix
  if (!apiKey.startsWith('sk-') && apiKey.length < 30) {
    console.warn(`Warning: DEEPSEEK_API_KEY format may be incorrect. Should start with 'sk-' and be at least 30 characters.`);
  }
  
  console.log(`DEEPSEEK_API_KEY is configured (starts with: ${apiKey.substring(0, 5)}...)`);
  
  // Test the API key with a minimal request if needed
  // This could be uncommented for more thorough validation
  /*
  try {
    const testResponse = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (testResponse.ok) {
      console.log('DEEPSEEK_API_KEY is valid - successfully connected to API');
    } else {
      console.warn(`DEEPSEEK_API_KEY may be invalid - API returned status ${testResponse.status}`);
    }
  } catch (error) {
    console.warn(`Could not validate DEEPSEEK_API_KEY: ${error.message}`);
  }
  */
}
