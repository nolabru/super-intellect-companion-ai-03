
import { UserMemory, ContextParams } from '@/services/context/types/ContextTypes';

/**
 * Repository interface for accessing user memory
 */
export interface MemoryRepository {
  /**
   * Get memory items for a user
   * @param userId - ID of the user
   * @param params - Optional parameters for filtering memory items
   * @returns Promise of user memory items
   */
  getUserMemory(
    userId: string,
    params?: {
      limit?: number;
      keyNames?: string[];
    }
  ): Promise<UserMemory[]>;
  
  /**
   * Get a formatted context string from user memory
   * @param userId - ID of the user
   * @param params - Parameters for context formatting
   * @returns Promise of formatted memory context
   */
  getUserMemoryContext(
    userId: string, 
    params?: {
      maxItems?: number;
      formatType?: 'detailed' | 'concise';
    }
  ): Promise<string>;
  
  /**
   * Save a new memory item for a user
   * @param memory - Memory item to save
   * @returns Promise of saved memory item
   */
  saveMemoryItem(memory: Omit<UserMemory, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserMemory>;
  
  /**
   * Update an existing memory item
   * @param memoryId - ID of the memory to update
   * @param updates - Fields to update
   * @returns Promise of updated memory item
   */
  updateMemoryItem(
    memoryId: string,
    updates: Partial<Omit<UserMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserMemory>;
  
  /**
   * Delete a memory item
   * @param memoryId - ID of the memory to delete
   * @returns Promise of success
   */
  deleteMemoryItem(memoryId: string): Promise<boolean>;
  
  /**
   * Find memory items relevant to a query
   * @param userId - ID of the user
   * @param query - Search query
   * @param params - Optional search parameters
   * @returns Promise of relevant memory items
   */
  findRelevantMemory(
    userId: string,
    query: string,
    params?: {
      limit?: number;
      threshold?: number;
    }
  ): Promise<UserMemory[]>;
}
