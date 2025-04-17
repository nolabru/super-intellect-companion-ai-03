
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
  
  // Verificação de formato atualizada para aceitar tanto luma_ quanto luma-
  if (apiKeyName === 'LUMA_API_KEY' && !apiKey.startsWith('luma_') && !apiKey.startsWith('luma-')) {
    console.warn(`Aviso: ${apiKeyName} parece não estar no formato esperado (esperado: 'luma_...' ou 'luma-...')`);
  }
  
  // Verificação específica para Kligin API Key
  if (apiKeyName === 'KLIGIN_API_KEY') {
    if (apiKey.length < 20) {
      console.warn(`Aviso: ${apiKeyName} pode não estar no formato esperado. Chaves Kligin geralmente têm pelo menos 20 caracteres. Valor fornecido: ${apiKey.substring(0, 5)}...`);
    } else {
      console.log(`${apiKeyName} parece estar no formato correto.`);
    }
  }
  
  // Verificação específica para Kligin Secret
  if (apiKeyName === 'KLIGIN_API_SECRET') {
    if (apiKey.length < 20) {
      console.warn(`Aviso: ${apiKeyName} pode não estar no formato esperado. Segredos Kligin geralmente têm pelo menos 20 caracteres. Valor fornecido: ${apiKey.substring(0, 5)}...`);
    } else {
      console.log(`${apiKeyName} parece estar no formato correto.`);
    }
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
