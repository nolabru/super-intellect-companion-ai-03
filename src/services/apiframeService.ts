
export const apiframeService = {
  // Configurar chave API
  setApiKey: (apiKey: string): boolean => {
    try {
      if (!apiKey || apiKey.trim() === '') {
        console.error('Chave API do APIframe inválida');
        return false;
      }
      
      // Armazenar chave API no localStorage
      localStorage.setItem('apiframe_api_key', apiKey);
      console.log('Chave API do APIframe configurada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao configurar chave API do APIframe:', error);
      return false;
    }
  },
  
  // Verificar se a chave API está configurada
  isApiKeyConfigured: (): boolean => {
    try {
      const apiKey = localStorage.getItem('apiframe_api_key');
      return !!apiKey && apiKey.trim() !== '';
    } catch (error) {
      console.error('Erro ao verificar chave API do APIframe:', error);
      return false;
    }
  },
  
  // Obter chave API configurada
  getApiKey: (): string | null => {
    try {
      return localStorage.getItem('apiframe_api_key');
    } catch (error) {
      console.error('Erro ao obter chave API do APIframe:', error);
      return null;
    }
  },
  
  // Remover chave API configurada
  removeApiKey: (): boolean => {
    try {
      localStorage.removeItem('apiframe_api_key');
      return true;
    } catch (error) {
      console.error('Erro ao remover chave API do APIframe:', error);
      return false;
    }
  }
};
