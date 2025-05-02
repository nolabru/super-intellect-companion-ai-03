
import { setupStorageBuckets } from './setupStorageBuckets';

export const initializeApp = async () => {
  try {
    // Configurar os buckets de armazenamento necessários
    await setupStorageBuckets();
    
    console.log('Inicialização do aplicativo concluída com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o aplicativo:', error);
  }
};
