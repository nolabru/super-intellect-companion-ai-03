
// Validate required API key
export function validateApiKey(apiKeyName: string, apiKey: string | undefined): void {
  if (!apiKey) {
    const error = `${apiKeyName} não está configurada`;
    throw new Error(error);
  }
  
  // Remover mensagem de log com valor parcial da chave para evitar problemas de segurança
  console.log(`Usando ${apiKeyName}`);
}

// Função para verificar se uma string é vazia ou whitespace
export function isEmptyOrWhitespace(str: string | null | undefined): boolean {
  return !str || str.trim() === '';
}

// Função para verificar se um valor existe e não está vazio
export function ensureValue(value: any, errorMessage: string): void {
  if (value === undefined || value === null || 
      (typeof value === 'string' && isEmptyOrWhitespace(value))) {
    throw new Error(errorMessage);
  }
}
