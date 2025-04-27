
export const extractMediaUrl = (content: string): string | null => {
  if (!content) return null;
  
  if (content.includes('[Imagem gerada]:') || 
      content.includes('[Vídeo gerado]:') || 
      content.includes('[Áudio gerado]:')) {
    const match = content.match(/\]\: (https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  }
  return null;
};

export const cleanMessageContent = (content: string): string => {
  if (!content) return '';
  
  return content
    .replace(/\[Imagem gerada\]\: https?:\/\/[^\s]+/, '')
    .replace(/\[Vídeo gerado\]\: https?:\/\/[^\s]+/, '')
    .replace(/\[Áudio gerado\]/, '')
    .trim();
};

export const getMediaTypeFromUrl = (url: string): 'image' | 'video' | 'audio' | null => {
  if (!url) return null;
  
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
  if (url.match(/\.(mp4|mov|webm)$/i)) return 'video';
  if (url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
  
  // Check content hints in URL
  if (url.includes('image')) return 'image';
  if (url.includes('video')) return 'video';
  if (url.includes('audio')) return 'audio';
  
  return null;
};
