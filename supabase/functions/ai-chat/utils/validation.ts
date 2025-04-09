
// Validate required API key
export function validateApiKey(apiKeyName: string, apiKey: string | undefined): void {
  if (!apiKey) {
    const error = `${apiKeyName} não está configurada`;
    throw new Error(error);
  }
  console.log(`Usando ${apiKeyName}: ${apiKey.substring(0, 10)}...`);
}
