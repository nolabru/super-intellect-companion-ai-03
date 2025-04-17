
import { ContextMessage } from '../types/ContextTypes';
import { BaseContextProcessor } from './BaseContextProcessor';

/**
 * Processor specifically for text messages
 */
export class TextContextProcessor extends BaseContextProcessor {
  /**
   * Check if this processor can handle the message
   * @param message - Message to check
   */
  canProcess(message: ContextMessage): boolean {
    // Can process any text-based message without media
    return message.mode === 'text' || (!message.files && !message.mediaUrl);
  }
  
  /**
   * Process the text message content
   * @param message - Message to process
   */
  async process(message: ContextMessage): Promise<{
    processedContent: string;
    entities?: string[];
    relevanceScore: number;
    metadata?: Record<string, any>;
  }> {
    try {
      // Clean the content
      const cleanedContent = this.cleanContent(message.content);
      
      // Extract entities
      const entities = this.extractBasicEntities(cleanedContent);
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(cleanedContent);
      
      console.log(`[TextContextProcessor] Processed message ${message.id}: ${entities.length} entities, score: ${relevanceScore}`);
      
      return {
        processedContent: cleanedContent,
        entities,
        relevanceScore,
        metadata: {
          contentLength: message.content.length,
          processedLength: cleanedContent.length,
          messageType: 'text'
        }
      };
    } catch (error) {
      console.error('[TextContextProcessor] Error processing message:', error);
      return {
        processedContent: message.content,
        relevanceScore: 0.5, // Default medium relevance on error
        metadata: { error: 'Processing error', messageType: 'text' }
      };
    }
  }
}
