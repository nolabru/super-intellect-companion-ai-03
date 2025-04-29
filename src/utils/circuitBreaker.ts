
/**
 * Implementação de Circuit Breaker para evitar chamadas repetidas a serviços com falha
 */

export enum CircuitState {
  CLOSED = 'CLOSED',    // Circuito fechado - operações normais
  OPEN = 'OPEN',        // Circuito aberto - falhas recentes, não tenta operações
  HALF_OPEN = 'HALF_OPEN'  // Circuito semi-aberto - permitindo tentativa de recuperação
}

export interface CircuitBreakerOptions {
  failureThreshold: number;    // Número de falhas consecutivas para abrir o circuito
  resetTimeout: number;        // Tempo em ms para tentar semi-abrir o circuito
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly options: CircuitBreakerOptions;
  
  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 segundos
      ...options
    };
  }
  
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      // Se o circuito está aberto, verificar se é hora de tentar novamente
      if (Date.now() > this.nextAttempt) {
        return this.attemptReset(operation);
      }
      throw new Error(`Circuit breaker is OPEN. Operation rejected until ${new Date(this.nextAttempt).toISOString()}`);
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private attemptReset<T>(operation: () => Promise<T>): Promise<T> {
    this.transitionTo(CircuitState.HALF_OPEN);
    
    try {
      const result = operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.transitionTo(CircuitState.CLOSED);
    }
    this.failureCount = 0;
  }
  
  private onFailure(): void {
    this.failureCount++;
    
    if (this.state === CircuitState.HALF_OPEN || 
        (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold)) {
      this.transitionTo(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }
  
  private transitionTo(state: CircuitState): void {
    if (this.state !== state) {
      const previousState = this.state;
      this.state = state;
      
      if (this.options.onStateChange) {
        this.options.onStateChange(previousState, state);
      }
    }
  }
  
  private isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }
  
  public getState(): CircuitState {
    return this.state;
  }
  
  public reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }
}

// Mapa de circuit breakers por serviço
const breakers = new Map<string, CircuitBreaker>();

/**
 * Obtém ou cria um circuit breaker para o serviço especificado
 */
export function getCircuitBreaker(serviceName: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!breakers.has(serviceName)) {
    breakers.set(serviceName, new CircuitBreaker(options || {
      failureThreshold: 3,
      resetTimeout: 30000,
      onStateChange: (from, to) => {
        console.log(`[CircuitBreaker:${serviceName}] Estado alterado de ${from} para ${to}`);
      }
    }));
  }
  
  return breakers.get(serviceName)!;
}
