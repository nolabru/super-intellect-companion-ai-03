
import { supabase } from '@/integrations/supabase/client';
import { ContextMessage, ContextParams } from '@/services/context/types/ContextTypes';
import { ContextRepository } from '../ContextRepository';

/**
 * Implementation of the ContextRepository using Supabase
 */
export class SupabaseContextRepository implements ContextRepository {
  /**
   * Get messages for a specific conversation
   * @param conversationId - ID of the conversation
   * @param params - Optional parameters for filtering messages
   * @returns Promise of conversation messages
   */
  async getMessagesForConversation(
    conversationId: string,
    params?: {
      limit?: number;
      offset?: number;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<ContextMessage[]> {
    try {
      console.log(`[SupabaseContextRepository] Getting messages for conversation ${conversationId}`);
      
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 30) - 1);
      }
      
      if (params?.startTime) {
        query = query.gte('timestamp', params.startTime);
      }
      
      if (params?.endTime) {
        query = query.lte('timestamp', params.endTime);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SupabaseContextRepository] Error fetching messages:', error);
        throw error;
      }
      
      // Transform to ContextMessage format and ensure sender is either "user" or "assistant"
      const messages: ContextMessage[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: this.normalizeSender(msg.sender),
        timestamp: msg.timestamp,
        model: msg.model,
        mode: msg.mode,
        files: msg.files,
        mediaUrl: msg.media_url
      }));
      
      console.log(`[SupabaseContextRepository] Retrieved ${messages.length} messages for conversation ${conversationId}`);
      return messages;
    } catch (err) {
      console.error('[SupabaseContextRepository] Error in getMessagesForConversation:', err);
      return [];
    }
  }
  
  /**
   * Get the most recent messages
   * @param limit - Maximum number of messages to return
   * @param params - Optional filtering parameters
   * @returns Promise of messages
   */
  async getRecentMessages(
    limit: number,
    params?: {
      userId?: string;
      modelId?: string;
      mode?: string;
    }
  ): Promise<ContextMessage[]> {
    try {
      console.log(`[SupabaseContextRepository] Getting ${limit} recent messages`);
      
      let query = supabase
        .from('messages')
        .select('*, conversations!inner(user_id)')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (params?.userId) {
        query = query.eq('conversations.user_id', params.userId);
      }
      
      if (params?.modelId) {
        query = query.eq('model', params.modelId);
      }
      
      if (params?.mode) {
        query = query.eq('mode', params.mode);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SupabaseContextRepository] Error fetching recent messages:', error);
        throw error;
      }
      
      // Transform to ContextMessage format with normalized sender
      const messages: ContextMessage[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: this.normalizeSender(msg.sender),
        timestamp: msg.timestamp,
        model: msg.model,
        mode: msg.mode,
        files: msg.files,
        mediaUrl: msg.media_url
      }));
      
      console.log(`[SupabaseContextRepository] Retrieved ${messages.length} recent messages`);
      return messages;
    } catch (err) {
      console.error('[SupabaseContextRepository] Error in getRecentMessages:', err);
      return [];
    }
  }
  
  /**
   * Save a processed message context
   * @param messageId - ID of the message
   * @param contextInfo - Information about the context that was built
   * @returns Promise of success
   */
  async saveProcessedContext(
    messageId: string,
    contextInfo: {
      contextLength: number;
      includedMessageIds: string[];
      strategyUsed: string;
      processingTimeMs: number;
    }
  ): Promise<boolean> {
    try {
      console.log(`[SupabaseContextRepository] Saving processed context for message ${messageId}`);
      
      // This is a stub implementation as we don't have a table for processed contexts yet
      // In a real implementation, this would save to a dedicated table
      
      return true;
    } catch (err) {
      console.error('[SupabaseContextRepository] Error in saveProcessedContext:', err);
      return false;
    }
  }
  
  /**
   * Search messages for relevant context
   * @param query - Search terms
   * @param params - Search parameters
   * @returns Promise of relevant messages
   */
  async searchRelevantMessages(
    query: string,
    params?: {
      userId?: string;
      limit?: number;
      threshold?: number;
    }
  ): Promise<ContextMessage[]> {
    try {
      console.log(`[SupabaseContextRepository] Searching for messages with query: ${query}`);
      
      // Simple content search implementation
      // In a production app, this would use vector search or a more sophisticated search
      const { data, error } = await supabase
        .from('messages')
        .select('*, conversations!inner(user_id)')
        .ilike('content', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(params?.limit || 10);
      
      if (error) {
        console.error('[SupabaseContextRepository] Error searching messages:', error);
        throw error;
      }
      
      // Filter by user if specified
      let filteredData = data;
      if (params?.userId) {
        filteredData = data.filter(msg => msg.conversations.user_id === params.userId);
      }
      
      // Transform to ContextMessage format with normalized sender
      const messages: ContextMessage[] = filteredData.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: this.normalizeSender(msg.sender),
        timestamp: msg.timestamp,
        model: msg.model,
        mode: msg.mode,
        files: msg.files,
        mediaUrl: msg.media_url
      }));
      
      console.log(`[SupabaseContextRepository] Found ${messages.length} relevant messages`);
      return messages;
    } catch (err) {
      console.error('[SupabaseContextRepository] Error in searchRelevantMessages:', err);
      return [];
    }
  }

  /**
   * Normalize the sender field to ensure it's either "user" or "assistant"
   * @param sender - Original sender value from database
   * @returns Normalized sender value
   */
  private normalizeSender(sender: string): "user" | "assistant" {
    // Ensure sender is one of the allowed values
    return sender === "user" ? "user" : "assistant";
  }
}
