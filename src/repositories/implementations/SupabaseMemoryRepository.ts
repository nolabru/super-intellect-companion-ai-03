
import { supabase } from '@/integrations/supabase/client';
import { UserMemory } from '@/services/context/types/ContextTypes';
import { MemoryRepository } from '../MemoryRepository';

/**
 * Implementation of the MemoryRepository using Supabase
 */
export class SupabaseMemoryRepository implements MemoryRepository {
  /**
   * Get memory items for a user
   * @param userId - ID of the user
   * @param params - Optional parameters for filtering memory items
   * @returns Promise of user memory items
   */
  async getUserMemory(
    userId: string,
    params?: {
      limit?: number;
      keyNames?: string[];
    }
  ): Promise<UserMemory[]> {
    try {
      console.log(`[SupabaseMemoryRepository] Getting memory for user ${userId}`);
      
      let query = supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId);
      
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.keyNames && params.keyNames.length > 0) {
        query = query.in('key_name', params.keyNames);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SupabaseMemoryRepository] Error fetching user memory:', error);
        throw error;
      }
      
      // Transform to UserMemory format
      const memory: UserMemory[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        keyName: item.key_name,
        value: item.value,
        title: item.title,
        source: item.source,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      console.log(`[SupabaseMemoryRepository] Retrieved ${memory.length} memory items for user ${userId}`);
      return memory;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in getUserMemory:', err);
      return [];
    }
  }
  
  /**
   * Get a formatted context string from user memory
   * @param userId - ID of the user
   * @param params - Parameters for context formatting
   * @returns Promise of formatted memory context
   */
  async getUserMemoryContext(
    userId: string, 
    params?: {
      maxItems?: number;
      formatType?: 'detailed' | 'concise';
    }
  ): Promise<string> {
    try {
      const memory = await this.getUserMemory(userId, { 
        limit: params?.maxItems || 20 
      });
      
      if (memory.length === 0) {
        return "";
      }
      
      // Format memory items into a context string
      let context = "Informações do usuário de conversas anteriores:\n";
      
      if (params?.formatType === 'detailed') {
        memory.forEach(item => {
          context += `\n${item.title || item.keyName}: ${item.value}`;
          if (item.source) {
            context += ` (Fonte: ${item.source})`;
          }
        });
      } else {
        // Concise format by default
        context += memory
          .map(item => `- ${item.title || item.keyName}: ${item.value}`)
          .join('\n');
      }
      
      console.log(`[SupabaseMemoryRepository] Generated memory context with ${memory.length} items for user ${userId}`);
      return context;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in getUserMemoryContext:', err);
      return "";
    }
  }
  
  /**
   * Save a new memory item for a user
   * @param memory - Memory item to save
   * @returns Promise of saved memory item
   */
  async saveMemoryItem(
    memory: Omit<UserMemory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserMemory> {
    try {
      console.log(`[SupabaseMemoryRepository] Saving memory item for user ${memory.userId}`);
      
      const { data, error } = await supabase
        .from('user_memory')
        .insert({
          user_id: memory.userId,
          key_name: memory.keyName,
          value: memory.value,
          title: memory.title,
          source: memory.source
        })
        .select()
        .single();
      
      if (error) {
        console.error('[SupabaseMemoryRepository] Error saving memory item:', error);
        throw error;
      }
      
      // Transform to UserMemory format
      const savedMemory: UserMemory = {
        id: data.id,
        userId: data.user_id,
        keyName: data.key_name,
        value: data.value,
        title: data.title,
        source: data.source,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      console.log(`[SupabaseMemoryRepository] Saved memory item with id ${savedMemory.id}`);
      return savedMemory;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in saveMemoryItem:', err);
      throw err;
    }
  }
  
  /**
   * Update an existing memory item
   * @param memoryId - ID of the memory to update
   * @param updates - Fields to update
   * @returns Promise of updated memory item
   */
  async updateMemoryItem(
    memoryId: string,
    updates: Partial<Omit<UserMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserMemory> {
    try {
      console.log(`[SupabaseMemoryRepository] Updating memory item ${memoryId}`);
      
      const updateData: any = {};
      if (updates.keyName !== undefined) updateData.key_name = updates.keyName;
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.source !== undefined) updateData.source = updates.source;
      
      const { data, error } = await supabase
        .from('user_memory')
        .update(updateData)
        .eq('id', memoryId)
        .select()
        .single();
      
      if (error) {
        console.error('[SupabaseMemoryRepository] Error updating memory item:', error);
        throw error;
      }
      
      // Transform to UserMemory format
      const updatedMemory: UserMemory = {
        id: data.id,
        userId: data.user_id,
        keyName: data.key_name,
        value: data.value,
        title: data.title,
        source: data.source,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      console.log(`[SupabaseMemoryRepository] Updated memory item ${memoryId}`);
      return updatedMemory;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in updateMemoryItem:', err);
      throw err;
    }
  }
  
  /**
   * Delete a memory item
   * @param memoryId - ID of the memory to delete
   * @returns Promise of success
   */
  async deleteMemoryItem(memoryId: string): Promise<boolean> {
    try {
      console.log(`[SupabaseMemoryRepository] Deleting memory item ${memoryId}`);
      
      const { error } = await supabase
        .from('user_memory')
        .delete()
        .eq('id', memoryId);
      
      if (error) {
        console.error('[SupabaseMemoryRepository] Error deleting memory item:', error);
        throw error;
      }
      
      console.log(`[SupabaseMemoryRepository] Deleted memory item ${memoryId}`);
      return true;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in deleteMemoryItem:', err);
      return false;
    }
  }
  
  /**
   * Find memory items relevant to a query
   * @param userId - ID of the user
   * @param query - Search query
   * @param params - Optional search parameters
   * @returns Promise of relevant memory items
   */
  async findRelevantMemory(
    userId: string,
    query: string,
    params?: {
      limit?: number;
      threshold?: number;
    }
  ): Promise<UserMemory[]> {
    try {
      console.log(`[SupabaseMemoryRepository] Searching memory for user ${userId} with query: ${query}`);
      
      // Simple search implementation
      // In a production app, this would use vector search or more sophisticated search
      const { data, error } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId)
        .or(`value.ilike.%${query}%, key_name.ilike.%${query}%, title.ilike.%${query}%`)
        .limit(params?.limit || 10);
      
      if (error) {
        console.error('[SupabaseMemoryRepository] Error searching memory:', error);
        throw error;
      }
      
      // Transform to UserMemory format
      const memory: UserMemory[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        keyName: item.key_name,
        value: item.value,
        title: item.title,
        source: item.source,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      console.log(`[SupabaseMemoryRepository] Found ${memory.length} relevant memory items`);
      return memory;
    } catch (err) {
      console.error('[SupabaseMemoryRepository] Error in findRelevantMemory:', err);
      return [];
    }
  }
}
