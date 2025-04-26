
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Memoized user ID to prevent unnecessary effect triggers
  const userId = useMemo(() => user?.id, [user]);

  // Load user memory items
  const loadMemoryItems = useCallback(async () => {
    if (!userId) {
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
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
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
  }, [userId]);

  // Add or update a memory item with optimistic update
  const saveMemoryItem = useCallback(async (key: string, value: string, source?: string, title?: string) => {
    if (!userId) {
      console.error('[useUserMemory] Não é possível salvar item de memória: Nenhum usuário logado');
      return false;
    }
    
    // Create new memory item 
    const newItem: MemoryItem = {
      key_name: title || key, // Use title as the key_name
      value,
      source,
      title
    };
    
    // Optimistically update UI
    setMemoryItems(prev => {
      const exists = prev.some(item => item.key_name === newItem.key_name);
      if (exists) {
        return prev.map(item => 
          item.key_name === newItem.key_name ? newItem : item
        );
      } else {
        return [newItem, ...prev];
      }
    });
    
    try {
      const { error } = await supabase
        .from('user_memory')
        .upsert({
          user_id: userId,
          key_name: newItem.key_name,
          value: newItem.value,
          source: newItem.source,
          title: newItem.title,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key_name'
        });
      
      if (error) {
        throw error;
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error('[useUserMemory] Erro ao salvar item de memória:', err);
      
      // Revert optimistic update on error
      loadMemoryItems();
      return false;
    }
  }, [userId, loadMemoryItems]);

  // Delete a memory item with optimistic update
  const deleteMemoryItem = useCallback(async (key: string) => {
    if (!userId) {
      console.error('[useUserMemory] Não é possível excluir item de memória: Nenhum usuário logado');
      return false;
    }
    
    // Optimistically update UI
    const previousItems = [...memoryItems];
    setMemoryItems(prev => prev.filter(item => item.key_name !== key));
    
    try {
      const { error } = await supabase
        .from('user_memory')
        .delete()
        .eq('user_id', userId)
        .eq('key_name', key);
      
      if (error) {
        throw error;
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error('[useUserMemory] Erro ao excluir item de memória:', err);
      
      // Revert optimistic update on error
      setMemoryItems(previousItems);
      return false;
    }
  }, [userId, memoryItems]);

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
  }, [loadMemoryItems, userId]);

  return {
    memoryItems,
    loading,
    error,
    loadMemoryItems,
    saveMemoryItem,
    deleteMemoryItem,
    getMemoryContext,
    getMemoryItem,
    lastUpdated
  };
}
