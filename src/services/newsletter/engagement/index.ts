
// Export all engagement services
import { incrementViewCount } from './viewService';
import { incrementLikeCount, hasUserLikedPost } from './likeService';
import { incrementShareCount } from './shareService';

// Re-export everything for backward compatibility
export {
  incrementViewCount,
  incrementLikeCount,
  hasUserLikedPost,
  incrementShareCount
};
