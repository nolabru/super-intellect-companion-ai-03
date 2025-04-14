
// Import deepseek-sdk from a CDN URL for Deno compatibility
import { Deepseek } from 'https://esm.sh/deepseek-sdk@1.0.0';

export async function generateText(content: string, modelId: string): Promise<{ content: string }> {
  const deepseek = new Deepseek({
    apiKey: Deno.env.get('DEEPSEEK_API_KEY')
  });

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

    const response = await deepseek.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: content }
      ]
    });

    return {
      content: response.choices[0].message.content || 'No response generated.'
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
}
