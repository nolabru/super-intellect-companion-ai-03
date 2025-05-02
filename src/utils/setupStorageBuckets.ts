
import { supabase } from '@/integrations/supabase/client';

export const setupStorageBuckets = async (): Promise<boolean> => {
  try {
    console.log('Configurando buckets de armazenamento...');
    
    const { data, error } = await supabase.functions.invoke('create-storage-buckets');
    
    if (error) {
      console.error('Erro ao configurar buckets de armazenamento:', error);
      return false;
    }
    
    console.log('Buckets de armazenamento configurados com sucesso:', data);
    return true;
  } catch (err) {
    console.error('Erro ao configurar buckets de armazenamento:', err);
    return false;
  }
};
