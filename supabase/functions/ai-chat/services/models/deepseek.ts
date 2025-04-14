
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

    console.log(`Calling Deepseek API with model: ${model}`);
    
    // Using direct HTTP requests instead of the SDK
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
      throw new Error(`Deepseek API returned status ${response.status}: ${errorText}`);
    }

    console.log("Deepseek API response received");
    const data = await response.json();
    
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
  // Simple validation to check if the key has a reasonable format
  if (apiKey.length < 20) {
    console.warn('Warning: DEEPSEEK_API_KEY seems unusually short');
  }
  console.log('DEEPSEEK_API_KEY is configured');
}
