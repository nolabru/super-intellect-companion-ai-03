
/**
 * Service for client-side media compression and optimization
 */
export const mediaCompressionService = {
  /**
   * Compress an image to a target file size or quality
   * @param imageUrl The URL or Data URL of the image to compress
   * @param options Compression options
   * @returns A promise that resolves to the compressed image data URL
   */
  async compressImage(
    imageUrl: string,
    options: {
      maxWidthOrHeight?: number;
      quality?: number;
      targetFileSizeKB?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<string> {
    const {
      maxWidthOrHeight = 1024,
      quality = 0.8,
      targetFileSizeKB,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas to resize and compress the image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions if needed
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image to canvas with new dimensions
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to the requested format
        let mimeType: string;
        switch (format) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }
        
        // If targeting a specific file size, use binary search to find appropriate quality
        if (targetFileSizeKB) {
          this.compressToTargetSize(canvas, mimeType, targetFileSizeKB)
            .then(resolve)
            .catch(reject);
        } else {
          // Use specified quality
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  },
  
  /**
   * Use binary search to find the best quality setting to achieve a target file size
   */
  async compressToTargetSize(
    canvas: HTMLCanvasElement,
    mimeType: string,
    targetFileSizeKB: number
  ): Promise<string> {
    const targetSizeBytes = targetFileSizeKB * 1024;
    let minQuality = 0.1;
    let maxQuality = 1.0;
    let currentQuality = 0.7; // Start with a reasonable quality
    let best = canvas.toDataURL(mimeType, currentQuality);
    let bestSize = this.getDataUrlSizeInBytes(best);
    let iterations = 0;
    
    while (iterations < 10) {
      iterations++;
      
      const dataUrl = canvas.toDataURL(mimeType, currentQuality);
      const size = this.getDataUrlSizeInBytes(dataUrl);
      
      // If we're close enough, return this result
      if (Math.abs(size - targetSizeBytes) / targetSizeBytes < 0.05) {
        return dataUrl;
      }
      
      // Update our best result if this is closer to target
      if (Math.abs(size - targetSizeBytes) < Math.abs(bestSize - targetSizeBytes)) {
        best = dataUrl;
        bestSize = size;
      }
      
      // Binary search: adjust quality based on current size
      if (size > targetSizeBytes) {
        maxQuality = currentQuality;
        currentQuality = (minQuality + currentQuality) / 2;
      } else {
        minQuality = currentQuality;
        currentQuality = (currentQuality + maxQuality) / 2;
      }
    }
    
    return best;
  },
  
  /**
   * Get the approximate size of a data URL in bytes
   */
  getDataUrlSizeInBytes(dataUrl: string): number {
    // Remove metadata from the Data URL (everything before the comma)
    const base64 = dataUrl.split(',')[1];
    
    // Base64 encodes 3 bytes into 4 characters
    return Math.floor(base64.length * 0.75);
  },
  
  /**
   * Detect the best format to use based on browser support
   */
  detectBestFormat(): 'webp' | 'jpeg' | 'png' {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    return 'jpeg';
  }
};
