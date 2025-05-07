
/**
 * Media utility functions for handling file operations, previews, and validations
 */

import { ChatMode } from '@/components/ModeSelector';

/**
 * Validates if a file matches the expected type based on ChatMode
 * @param file The file to validate
 * @param mode The current chat mode
 * @returns Boolean indicating if file matches the expected type
 */
export function isValidFileForMode(file: File, mode: ChatMode): boolean {
  if (!file) return false;
  
  switch (mode) {
    case 'image':
      return file.type.startsWith('image/');
    case 'video':
      return file.type.startsWith('video/');
    case 'audio':
      return file.type.startsWith('audio/');
    case 'text':
    case 'call':
    default:
      return false;
  }
}

/**
 * Creates a human-readable file size string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get appropriate file accept string for HTML file input based on mode
 * @param mode The current chat mode
 * @returns String for accept attribute of file input
 */
export function getAcceptTypesByMode(mode: ChatMode): string {
  switch (mode) {
    case 'image':
      return 'image/*';
    case 'video':
      return 'video/*';
    case 'audio':
      return 'audio/*';
    default:
      return '';
  }
}

/**
 * Safely revokes object URLs to prevent memory leaks
 * @param urls Array of object URLs to revoke
 */
export function revokeObjectUrls(urls: string[]): void {
  if (!urls || !Array.isArray(urls)) return;
  
  urls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error revoking URL:', error);
      }
    }
  });
}

/**
 * Downloads a media file from a URL
 * @param url URL of the media to download
 * @param mediaType Type of media (image, video, audio)
 * @param title Optional title to use in the filename
 * @returns Promise that resolves when download is complete
 */
export function downloadMediaFromUrl(url: string, mediaType: string, title?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        const extension = mediaType === 'image' ? 'png' : 
                          mediaType === 'video' ? 'mp4' : 
                          mediaType === 'audio' ? 'mp3' : 'file';
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeTitle = (title || 'media').replace(/[^a-z0-9]/gi, '-').substring(0, 30);
        
        link.download = `${safeTitle}-${timestamp}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        resolve();
      })
      .catch(error => {
        console.error('Download failed:', error);
        reject(error);
      });
  });
}

/**
 * Creates a readable label based on chat mode
 * @param mode The current chat mode
 * @returns Human-readable label
 */
export function getChatModeLabel(mode: ChatMode): string {
  switch (mode) {
    case 'text':
      return 'Texto';
    case 'image':
      return 'Imagem';
    case 'video':
      return 'Vídeo';
    case 'audio':
      return 'Áudio';
    case 'call':
      return 'Chamada';
    default:
      return 'Desconhecido';
  }
}

/**
 * Extracts media URL from a message content if present
 * @param content Message content that might contain a media URL
 * @returns The extracted media URL or null
 */
export function extractMediaUrl(content: string): string | null {
  if (!content) return null;
  
  // Check for URL patterns in the content
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // Return the first URL found
    return matches[0];
  }
  
  return null;
}

/**
 * Cleans message content by removing media URLs
 * @param content Original message content
 * @returns Cleaned message content
 */
export function cleanMessageContent(content: string): string {
  if (!content) return '';
  
  // Remove URLs from the content
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(urlRegex, '').trim();
}
