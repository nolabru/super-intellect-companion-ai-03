
// Este é um script auxiliar que pode ser usado pelo administrador 
// para atualizar tokens do usuário joao.diroteldes@gmail.com 
// Não é para uso em produção, apenas para facilitar a tarefa imediata

import { supabase } from '../integrations/supabase/client';

export async function updateTokensForUser() {
  try {
    // Definindo o email e a quantidade de tokens
    const email = 'joao.diroteldes@gmail.com';
    const tokens = 10000;
    
    console.log(`Atualizando tokens para ${email} para ${tokens} tokens...`);
    
    // Buscando a sessão atual do usuário autenticado (deve ser um admin)
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.error('Nenhum usuário autenticado. Por favor, faça login como administrador.');
      return;
    }
    
    // Chamando a edge function para atualizar os tokens
    const { data, error } = await supabase.functions.invoke('admin-update-tokens', {
      body: {
        email,
        tokens
      }
    });
    
    if (error) {
      console.error('Erro ao atualizar tokens:', error);
      return;
    }
    
    console.log('Resposta:', data);
    console.log('Tokens atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
}
