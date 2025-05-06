
/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retries before failing */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Function to determine if error is retryable, defaults to retry all errors */
  isRetryable?: (error: any) => boolean;
  /** Whether to use exponential backoff (increases delay with each retry) */
  useExponentialBackoff?: boolean;
  /** Max delay in milliseconds when using exponential backoff */
  maxBackoffDelay?: number;
  /** Whether to log retry attempts */
  logRetries?: boolean;
}

/**
 * Execute an operation with retry logic
 * @param operation The async operation to execute
 * @param options Retry options
 * @returns The result of the operation
 * @throws Error if max retries reached
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    isRetryable = () => true,
    useExponentialBackoff = true,
    maxBackoffDelay = 30000,
    logRetries = true
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
    try {
      if (logRetries && attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
      }
      
      return await operation();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (!isRetryable(error)) {
        throw lastError;
      }
      
      // Special handling for authentication errors
      if (error.message && (
        error.message.includes('authorization') || 
        error.message.includes('401') || 
        error.message.includes('Authentication')
      )) {
        console.warn(`Authentication error detected on attempt ${attempt+1}:`, error.message);
      }
      
      // If we've reached max retries, throw the error
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff if enabled
      const delay = useExponentialBackoff
        ? Math.min(initialDelay * Math.pow(2, attempt), maxBackoffDelay)
        : initialDelay;
        
      if (logRetries) {
        console.log(`Operation failed, retrying in ${delay}ms...`, lastError);
      }
      
      // Wait before the next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throw in the loop
  throw lastError || new Error('Operation failed for unknown reason');
}
