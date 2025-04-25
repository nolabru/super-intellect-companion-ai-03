
export function calculateProgress(currentProgress: number, status: string): number {
  if (status === 'pending') {
    // Increment by 5% up to 40% max for pending status
    return Math.min(40, currentProgress + 5);
  } else if (status === 'processing') {
    // Increment by 10% up to 90% max for processing status
    return Math.min(90, Math.max(50, currentProgress + 10));
  } else if (status === 'completed') {
    return 100;
  } else {
    return currentProgress;
  }
}

