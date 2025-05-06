
/**
 * Executes an operation with retry logic
 * @param operation The async operation to execute
 * @param options Retry configuration options
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    factor?: number;
    maxDelay?: number;
    retryCondition?: (error: any) => boolean;
    onRetry?: (error: any, attemptNumber: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    factor = 2,
    maxDelay = 10000,
    retryCondition = () => true,
    onRetry = () => {}
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (!retryCondition(error) || attempt >= maxRetries - 1) {
        break;
      }
      
      attempt++;
      
      // Notify about retry
      onRetry(error, attempt);
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Executes a primary operation with a fallback if it fails
 * @param primaryOperation The primary async operation to execute
 * @param fallbackOperation The fallback async operation to execute if primary fails
 * @returns The result of either the primary or fallback operation
 */
export async function withFallback<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: (error: any) => Promise<T>
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (error) {
    return await fallbackOperation(error);
  }
}
