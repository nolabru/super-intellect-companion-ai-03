
import { ContextStrategy } from './ContextStrategy';
import { DefaultContextStrategy } from './DefaultContextStrategy';

/**
 * Service that manages and provides context strategies
 */
export class ContextStrategyService {
  private strategies: ContextStrategy[] = [];
  private defaultStrategy: ContextStrategy;
  
  constructor() {
    // Initialize with default strategy
    this.defaultStrategy = new DefaultContextStrategy();
    this.strategies = [this.defaultStrategy];
    
    console.log('[ContextStrategyService] Initialized with default strategy');
  }
  
  /**
   * Register a new context strategy
   * @param strategy - Strategy to register
   */
  registerStrategy(strategy: ContextStrategy): void {
    this.strategies.push(strategy);
    console.log(`[ContextStrategyService] Registered new strategy, total: ${this.strategies.length}`);
  }
  
  /**
   * Get appropriate strategy for model and mode
   * @param modelId - Model identifier
   * @param mode - Chat mode
   * @returns Appropriate context strategy
   */
  getStrategyForModelAndMode(modelId: string, mode: string): ContextStrategy {
    // Find the first strategy that can handle this model/mode
    const strategy = this.strategies.find(s => s.canHandle(modelId, mode));
    
    if (strategy) {
      console.log(`[ContextStrategyService] Found specific strategy for model ${modelId}, mode ${mode}`);
      return strategy;
    }
    
    // Fall back to default if no specific strategy found
    console.log(`[ContextStrategyService] Using default strategy for model ${modelId}, mode ${mode}`);
    return this.defaultStrategy;
  }
}
