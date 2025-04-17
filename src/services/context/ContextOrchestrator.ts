
import { ContextRepository } from '../../repositories/ContextRepository';
import { MemoryRepository } from '../../repositories/MemoryRepository';
import { ContextProcessor } from './processors/ContextProcessor';
import { ContextStrategyService } from './strategies/ContextStrategyService';
import { ContextMessage, ContextParams, ContextResult, UserMemory } from './types/ContextTypes';

/**
 * Central orchestrator for building and managing conversation context
 */
export class ContextOrchestrator {
  constructor(
    private contextRepository: ContextRepository,
    private memoryRepository: MemoryRepository,
    private processors: ContextProcessor[],
    private strategyService: ContextStrategyService
  ) {
    console.log('[ContextOrchestrator] Initialized with:');
    console.log(`- ${processors.length} processors`);
  }
  
  /**
   * Build context for a message based on conversation history and user memory
   * @param params - Parameters for context building
   * @returns Processed context result
   */
  async buildContextForMessage(params: ContextParams): Promise<ContextResult> {
    console.log(`[ContextOrchestrator] Building context with params:`, params);
    const startTime = Date.now();
    
    // Get conversation messages
    let messages: ContextMessage[] = [];
    if (params.conversationId) {
      messages = await this.contextRepository.getMessagesForConversation(
        params.conversationId, 
        { limit: params.maxMessages || 30 }
      );
      console.log(`[ContextOrchestrator] Retrieved ${messages.length} messages for conversation ${params.conversationId}`);
    }
    
    // Get user memory if requested and userId is provided
    let userMemory: UserMemory[] = [];
    if (params.includeUserMemory && params.userId) {
      userMemory = await this.memoryRepository.getUserMemory(
        params.userId,
        { limit: 20 }
      );
      console.log(`[ContextOrchestrator] Retrieved ${userMemory.length} memory items for user ${params.userId}`);
    }
    
    // Get the appropriate strategy for the model and mode
    const strategy = this.strategyService.getStrategyForModelAndMode(
      params.modelId || 'default',
      params.mode || 'text'
    );
    
    // Format the context using the selected strategy
    const formattedContext = strategy.formatForModel(
      messages,
      userMemory,
      params
    );
    
    // Prepare result metrics
    const processingTime = Date.now() - startTime;
    
    // Return the complete context result
    const result: ContextResult = {
      formattedContext,
      contextLength: formattedContext.length,
      includedMessages: messages,
      includedMemory: userMemory,
      targetModel: params.modelId,
      strategyUsed: strategy.constructor.name,
      memoryIncluded: userMemory.length > 0,
      metrics: {
        processingTimeMs: processingTime,
        estimatedTokenCount: Math.round(formattedContext.length / 4) // Rough estimation
      }
    };
    
    console.log(`[ContextOrchestrator] Context built in ${processingTime}ms, length: ${formattedContext.length} chars`);
    return result;
  }
  
  /**
   * Find appropriate processor for a message
   * @param message - Message to process
   * @returns Appropriate processor or undefined if none found
   */
  private findProcessorForMessage(message: ContextMessage): ContextProcessor | undefined {
    return this.processors.find(processor => processor.canProcess(message));
  }
  
  /**
   * Process a message and save its processed context
   * @param messageId - ID of the message to process
   * @param params - Processing parameters
   */
  async processMessageContext(messageId: string, params: ContextParams): Promise<void> {
    try {
      console.log(`[ContextOrchestrator] Processing message context for ${messageId}`);
      const startTime = Date.now();
      
      // Get messages for the conversation
      const messages = await this.contextRepository.getMessagesForConversation(
        params.conversationId || '',
        { limit: params.maxMessages || 30 }
      );
      
      // Find the target message
      const targetMessage = messages.find(msg => msg.id === messageId);
      if (!targetMessage) {
        console.error(`[ContextOrchestrator] Message ${messageId} not found`);
        return;
      }
      
      // Find processor for the message
      const processor = this.findProcessorForMessage(targetMessage);
      if (!processor) {
        console.error(`[ContextOrchestrator] No processor found for message ${messageId}`);
        return;
      }
      
      // Process the message
      await processor.process(targetMessage);
      
      // Save the processed context information
      await this.contextRepository.saveProcessedContext(messageId, {
        contextLength: messages.length,
        includedMessageIds: messages.map(msg => msg.id),
        strategyUsed: params.modelId || 'default',
        processingTimeMs: Date.now() - startTime
      });
      
      console.log(`[ContextOrchestrator] Processed and saved context for message ${messageId}`);
    } catch (error) {
      console.error(`[ContextOrchestrator] Error processing message context:`, error);
    }
  }
}
