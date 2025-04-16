
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemoryItem {
  key_name: string;
  value: string;
  source?: string;
  title?: string;
}

export function useUserMemory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load user memory items
  const loadMemoryItems = useCallback(async () => {
    if (!user) {
      setMemoryItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_memory')
        .select('key_name, value, source, title')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setMemoryItems(data || []);
    } catch (err) {
      console.error('[useUserMemory] Erro ao carregar itens de memória:', err);
      setError('Falha ao carregar itens de memória do usuário');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add or update a memory item
  const saveMemoryItem = useCallback(async (key: string, value: string, source?: string, title?: string) => {
    if (!user) {
      console.error('[useUserMemory] Não é possível salvar item de memória: Nenhum usuário logado');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_memory')
        .upsert({
          user_id: user.id,
          key_name: title, // Use title as the key_name
          value,
          source,
          title,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key_name'
        });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setMemoryItems(prev => {
        const exists = prev.some(item => item.key_name === title);
        if (exists) {
          return prev.map(item => 
            item.key_name === title ? { key_name: title, value, source, title } : item
          );
        } else {
          return [...prev, { key_name: title, value, source, title }];
        }
      });
      
      return true;
    } catch (err) {
      console.error('[useUserMemory] Erro ao salvar item de memória:', err);
      return false;
    }
  }, [user]);

  // Delete a memory item
  const deleteMemoryItem = useCallback(async (key: string) => {
    if (!user) {
      console.error('[useUserMemory] Não é possível excluir item de memória: Nenhum usuário logado');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_memory')
        .delete()
        .eq('user_id', user.id)
        .eq('key_name', key);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setMemoryItems(prev => prev.filter(item => item.key_name !== key));
      return true;
    } catch (err) {
      console.error('[useUserMemory] Erro ao excluir item de memória:', err);
      return false;
    }
  }, [user]);

  // Get all memory as a formatted context string
  const getMemoryContext = useCallback(() => {
    if (memoryItems.length === 0) {
      return "";
    }
    
    return "Informações do usuário de conversas anteriores:\n" + 
      memoryItems.map(item => `- ${item.title || item.key_name}: ${item.value}`).join('\n');
  }, [memoryItems]);

  // Get a specific memory item
  const getMemoryItem = useCallback((key: string) => {
    return memoryItems.find(item => item.key_name === key)?.value || null;
  }, [memoryItems]);

  // Load memory items on component mount or when user changes
  useEffect(() => {
    loadMemoryItems();
  }, [loadMemoryItems]);

  return {
    memoryItems,
    loading,
    error,
    loadMemoryItems,
    saveMemoryItem,
    deleteMemoryItem,
    getMemoryContext,
    getMemoryItem
  };
}

