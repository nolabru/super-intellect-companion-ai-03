
// Validate required API key
export function validateApiKey(apiKeyName: string, apiKey: string | undefined): void {
  console.log(`Validating ${apiKeyName}...`);
  
  if (!apiKey) {
    const error = `${apiKeyName} não está configurada. Por favor, adicione esta chave nas variáveis de ambiente da sua função Edge.`;
    console.error(error);
    throw new Error(error);
  }
  
  if (apiKey.trim() === '') {
    const error = `${apiKeyName} está configurada mas vazia. Por favor, verifique o valor nas variáveis de ambiente.`;
    console.error(error);
    throw new Error(error);
  }
  
  // Verificação básica de formato para chaves da Luma (começam com luma_)
  if (apiKeyName === 'LUMA_API_KEY' && !apiKey.startsWith('luma_')) {
    console.warn(`Aviso: ${apiKeyName} parece não estar no formato esperado (esperado: 'luma_...')`);
  }
  
  // Log seguro para confirmar que a chave foi encontrada (sem expor a chave completa)
  console.log(`${apiKeyName} encontrada. Primeiros 5 caracteres: ${apiKey.substring(0, 5)}...`);
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
