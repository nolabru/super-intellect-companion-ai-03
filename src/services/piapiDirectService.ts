
/**
 * Utility functions for direct PiAPI service interactions
 */

/**
 * Check if PiAPI API key is configured
 */
export const hasPiapiApiKey = (): boolean => {
  return !!localStorage.getItem('piapi_api_key');
};

/**
 * Get the stored PiAPI API key
 */
export const getPiapiApiKey = (): string | null => {
  return localStorage.getItem('piapi_api_key');
};

/**
 * Set the PiAPI API key
 */
export const setPiapiApiKey = (apiKey: string): boolean => {
  try {
    localStorage.setItem('piapi_api_key', apiKey);
    return true;
  } catch (error) {
    console.error('Error setting PiAPI API key:', error);
    return false;
  }
};

/**
 * Remove the stored PiAPI API key
 */
export const removePiapiApiKey = (): void => {
  localStorage.removeItem('piapi_api_key');
};
