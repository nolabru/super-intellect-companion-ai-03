
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemoryItem {
  key_name: string;
  value: string;
  source?: string;
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
        .select('key_name, value, source')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setMemoryItems(data || []);
    } catch (err) {
      console.error('[useUserMemory] Error loading memory items:', err);
      setError('Failed to load user memory items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add or update a memory item
  const saveMemoryItem = useCallback(async (key: string, value: string, source?: string) => {
    if (!user) {
      console.error('[useUserMemory] Cannot save memory item: No user logged in');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_memory')
        .upsert({
          user_id: user.id,
          key_name: key,
          value,
          source,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key_name'
        });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setMemoryItems(prev => {
        const exists = prev.some(item => item.key_name === key);
        if (exists) {
          return prev.map(item => 
            item.key_name === key ? { key_name: key, value, source } : item
          );
        } else {
          return [...prev, { key_name: key, value, source }];
        }
      });
      
      return true;
    } catch (err) {
      console.error('[useUserMemory] Error saving memory item:', err);
      return false;
    }
  }, [user]);

  // Delete a memory item
  const deleteMemoryItem = useCallback(async (key: string) => {
    if (!user) {
      console.error('[useUserMemory] Cannot delete memory item: No user logged in');
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
      console.error('[useUserMemory] Error deleting memory item:', err);
      return false;
    }
  }, [user]);

  // Get all memory as a formatted context string
  const getMemoryContext = useCallback(() => {
    if (memoryItems.length === 0) {
      return "";
    }
    
    return "User information from previous conversations:\n" + 
      memoryItems.map(item => `- ${item.key_name}: ${item.value}`).join('\n');
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
