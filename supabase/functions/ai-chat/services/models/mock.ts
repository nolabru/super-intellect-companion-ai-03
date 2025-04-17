
// Mock service for testing without real API calls

/**
 * Generate a mock AI response for testing without using real APIs
 */
export async function generateMockResponse(prompt: string, mode: string, modelId: string) {
  console.log(`[Mock] Generating ${mode} response for prompt: "${prompt.substring(0, 50)}..."`);
  
  // Create response based on the requested mode
  if (mode === 'text') {
    return {
      content: `This is a mock response to: "${prompt}"\n\nModel ID: ${modelId}\nMode: ${mode}`,
      tokenInfo: {
        tokensUsed: 10,
        tokensRemaining: 9990
      }
    };
  } else if (mode === 'image') {
    return {
      content: `Mock image generated for: "${prompt}"`,
      files: ["https://via.placeholder.com/512x512.png?text=MockAI+Image"],
      tokenInfo: {
        tokensUsed: 50,
        tokensRemaining: 9950
      }
    };
  } else if (mode === 'video') {
    return {
      content: `Mock video generated for: "${prompt}"`,
      files: ["https://placeholder.com/video.mp4"],
      tokenInfo: {
        tokensUsed: 100,
        tokensRemaining: 9900
      }
    };
  } else if (mode === 'audio') {
    return {
      content: `Mock audio generated for: "${prompt}"`,
      files: ["https://placeholder.com/audio.mp3"],
      tokenInfo: {
        tokensUsed: 75,
        tokensRemaining: 9925
      }
    };
  }
  
  // Default fallback response
  return {
    content: `Mock response for unsupported mode "${mode}" with prompt: "${prompt}"`,
    tokenInfo: {
      tokensUsed: 5,
      tokensRemaining: 9995
    }
  };
}
