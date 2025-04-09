
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
      console.log(`Tentativa ${attempt + 1} para URL: ${url}`);
      const response = await fetch(url, options);
      
      // Log response status para debugging
      console.log(`Resposta recebida com status: ${response.status}`);
      
      // Se receber qualquer resposta, verifique o corpo para debug
      const responseClone = response.clone();
      try {
        const bodyText = await responseClone.text();
        console.log(`Corpo da resposta (${bodyText.length > 1000 ? bodyText.length + " chars" : "completo"}):`);
        if (bodyText.length <= 1000) {
          console.log(bodyText);
        } else {
          console.log(bodyText.substring(0, 1000) + "...");
        }
      } catch (e) {
        console.log("Não foi possível ler o corpo da resposta:", e);
      }
      
      // If we get a 429 (Too Many Requests) or 5xx (Server Error), wait and retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        console.log(`Request failed with status ${response.status} (attempt ${attempt + 1}/${maxRetries}), waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error("Maximum retries exceeded");
}
