
export const getModelBubbleColor = (model: string): string => {
  // Define model-specific colors
  const modelColors: Record<string, { background: string }> = {
    'claude-3-opus': {
      background: 'from-orange-500 to-orange-600'
    },
    'gpt-4o': {
      background: 'from-blue-500 to-blue-600'
    }
    // Add more models as needed
  };

  return modelColors[model]?.background || 'from-blue-500 to-blue-600';
};
