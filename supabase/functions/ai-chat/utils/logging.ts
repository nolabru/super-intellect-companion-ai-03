
// Enhanced error logging function with detailed information
export function logError(errorType: string, details: any) {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    type: errorType,
    details: details
  };
  
  console.error(`AI-CHAT ERROR [${errorType}] [${timestamp}]:`, JSON.stringify(errorLog, null, 2));
}

// Additional logging function for informational messages
export function logInfo(infoType: string, details: any) {
  const timestamp = new Date().toISOString();
  const infoLog = {
    timestamp,
    type: infoType,
    details: details
  };
  
  console.log(`AI-CHAT INFO [${infoType}] [${timestamp}]:`, JSON.stringify(infoLog, null, 2));
}

// Function to handle requests with retries and exponential backoff
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries} for URL: ${url}`);
      
      // Log request headers (without Authorization for security)
      const safeHeaders = { ...options.headers } as Record<string, string>;
      if (safeHeaders['Authorization']) {
        safeHeaders['Authorization'] = 'Bearer [REDACTED]';
      }
      console.log(`Request headers: ${JSON.stringify(safeHeaders, null, 2)}`);
      
      // Try to parse and log request body if it's JSON (limited for privacy)
      if (options.body && typeof options.body === 'string') {
        try {
          const bodyObj = JSON.parse(options.body);
          // Only log non-sensitive parts
          const safeBody = {
            prompt: bodyObj.prompt ? bodyObj.prompt.substring(0, 30) + '...' : undefined,
            n: bodyObj.n,
            size: bodyObj.size,
            response_format: bodyObj.response_format,
            duration: bodyObj.duration,
            resolution: bodyObj.resolution
          };
          console.log(`Request body preview: ${JSON.stringify(safeBody, null, 2)}`);
        } catch (e) {
          console.log(`Request body is not parseable JSON`);
        }
      }
      
      const response = await fetch(url, options);
      
      // Log response status for debugging
      console.log(`Response received with status: ${response.status}`);
      
      // If we get a 429 (Too Many Requests) or 5xx (Server Error), wait and retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        console.log(`Request failed with status ${response.status} (attempt ${attempt + 1}/${maxRetries}), waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
      
      // Clone response to inspect its body without consuming it
      const responseClone = response.clone();
      try {
        // Try to get response as text
        const bodyText = await responseClone.text();
        console.log(`Response body (${bodyText.length > 1000 ? bodyText.length + " chars" : "complete"}):`);
        if (bodyText.length <= 1000) {
          console.log(bodyText);
        } else {
          console.log(bodyText.substring(0, 1000) + "...");
        }
        
        // Try to parse as JSON for prettier logging
        try {
          const bodyJson = JSON.parse(bodyText);
          console.log(`Response parsed as JSON: ${JSON.stringify(bodyJson, null, 2).substring(0, 500)}${bodyText.length > 500 ? '...' : ''}`);
        } catch (e) {
          // Not JSON, already logged as text
        }
      } catch (e) {
        console.log("Could not read response body:", e);
      }
      
      return response;
    } catch (error) {
      console.error(`Network error on attempt ${attempt + 1}/${maxRetries}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Maximum retries exceeded with no response");
}
