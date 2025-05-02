
export function calculateProgress(currentProgress: number, status: string): number {
  if (status === 'completed') {
    return 100;
  }
  
  if (status === 'failed') {
    return currentProgress; // Keep the current progress if failed
  }
  
  // For pending or processing status
  if (currentProgress < 90) {
    // Gradually increase progress but never reach 100% until completed
    return currentProgress + Math.random() * 5;
  }
  
  return 90; // Cap at 90% until completed
}
