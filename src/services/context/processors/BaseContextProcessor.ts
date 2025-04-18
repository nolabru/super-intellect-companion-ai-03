
import { ContextMessage } from '../types/ContextTypes';
import { ContextProcessor } from './ContextProcessor';

/**
 * Abstract base class for context processors
 * Implements common functionality shared across processors
 */
export abstract class BaseContextProcessor implements ContextProcessor {
  /**
   * Check if this processor can handle the message
   * @param message - Message to check
   */
  abstract canProcess(message: ContextMessage): boolean;
  
  /**
   * Process the message content
   * @param message - Message to process
   */
  abstract process(message: ContextMessage): Promise<{
    processedContent: string;
    entities?: string[];
    relevanceScore: number;
    metadata?: Record<string, any>;
  }>;
  
  /**
   * Clean content for context by removing large data
   * @param content - Raw content
   * @returns Cleaned content
   */
  protected cleanContent(content: string): string {
    return content
      .replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]')
      .replace(/(https?:\/\/[^\s]{50,})/g, '[URL]')
      .replace(/```[\s\S]{500,}```/g, '[BLOCO DE CÓDIGO]')
      .trim();
  }
  
  /**
   * Calculate a basic relevance score based on content length and keywords
   * @param content - Message content
   * @returns Relevance score between 0-1
   */
  protected calculateRelevanceScore(content: string): number {
    if (!content || content.length === 0) return 0;
    
    // Basic heuristic: longer content with more unique words is more relevant
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    
    // Calculate score based on content length and unique words ratio
    const lengthScore = Math.min(content.length / 1000, 0.6);
    const uniquenessScore = Math.min(uniqueWords.size / words.length, 1) * 0.4;
    
    return lengthScore + uniquenessScore;
  }
  
  /**
   * Extract basic entities from content
   * @param content - Message content
   * @returns Array of extracted entities
   */
  protected extractBasicEntities(content: string): string[] {
    const entities: string[] = [];
    
    // Extract potential proper nouns (words starting with capital letter)
    const properNouns = content.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    entities.push(...properNouns);
    
    // Extract potential email addresses
    const emails = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    entities.push(...emails);
    
    // Return unique entities
    return [...new Set(entities)];
  }
}
