
import { ContextMessage } from '../types/ContextTypes';
import { BaseContextProcessor } from './BaseContextProcessor';

/**
 * Processor specifically for text messages
 */
export class TextContextProcessor extends BaseContextProcessor {
  /**
   * Check if this processor can handle the message
   * @param message - Message to check
   * @returns Whether this processor can process the message
   */
  canProcess(message: ContextMessage): boolean {
    // Handle all text messages or messages without a specified mode
    return !message.mode || message.mode === 'text';
  }
  
  /**
   * Process the text message to extract context information
   * @param message - Message to process
   * @returns Processed data and metadata
   */
  async process(message: ContextMessage): Promise<{
    processedContent: string;
    entities?: string[];
    relevanceScore: number;
    metadata?: Record<string, any>;
  }> {
    if (!message.content) {
      console.log('[TextContextProcessor] Mensagem sem conteúdo para processar');
      return {
        processedContent: '',
        entities: [],
        relevanceScore: 0,
        metadata: { empty: true }
      };
    }
    
    // Clean the content
    const cleanedContent = this.cleanContent(message.content);
    
    // Extract basic entities (like names, emails, etc.)
    const entities = this.extractBasicEntities(cleanedContent);
    
    // Calculate a relevance score based on content
    const relevanceScore = this.calculateRelevanceScore(cleanedContent);
    
    console.log(`[TextContextProcessor] Mensagem processada: ${cleanedContent.substring(0, 100)}...`);
    console.log(`[TextContextProcessor] Entidades extraídas: ${entities.length}`);
    console.log(`[TextContextProcessor] Pontuação de relevância: ${relevanceScore}`);
    
    return {
      processedContent: cleanedContent,
      entities,
      relevanceScore,
      metadata: {
        processedAt: new Date().toISOString(),
        length: cleanedContent.length,
        sender: message.sender
      }
    };
  }
}
