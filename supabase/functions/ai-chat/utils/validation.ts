
export function validateApiKey(name: string, value: string): void {
  if (!value || value.trim() === '') {
    throw new Error(`${name} is not configured or is empty`);
  }
}

// Simple function to validate essential inputs
export function validateInputs(content: string, modelId: string): void {
  if (!content) {
    throw new Error("Message content is required");
  }

  if (!modelId) {
    throw new Error("Model ID is required");
  }
}
