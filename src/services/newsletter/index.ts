
import * as postService from './postService';
import * as queryService from './queryService';
import * as statsService from './statsService';
import * as engagementService from './engagementService';
import * as commentService from './commentService';
import { mapPostToFrontend, getUserInfo } from './utils';

// Export all services as a single object
export const newsletterService = {
  // Post operations
  createPost: postService.createPost,
  updatePost: postService.updatePost,
  deletePost: postService.deletePost,
  getPostById: postService.getPostById,
  publishPost: postService.publishPost,
  unpublishPost: postService.unpublishPost,
  
  // Query operations
  getPosts: queryService.getPosts,
  getPublishedPosts: queryService.getPublishedPosts,
  getPostsByUserId: queryService.getPostsByUserId,
  getPublishedPostsByUserId: queryService.getPublishedPostsByUserId,
  getPostsBySearchTerm: queryService.getPostsBySearchTerm,
  getPostsByCategory: queryService.getPostsByCategory,
  getPopularPosts: queryService.getPopularPosts,
  getRecentPosts: queryService.getRecentPosts,
  
  // Stats operations
  getTotalPostsCount: statsService.getTotalPostsCount,
  getTotalPublishedPostsCount: statsService.getTotalPublishedPostsCount,
  getTotalPostsCountByUserId: statsService.getTotalPostsCountByUserId,
  getTotalPublishedPostsCountByUserId: statsService.getTotalPublishedPostsCountByUserId,
  getTotalPostsCountBySearchTerm: statsService.getTotalPostsCountBySearchTerm,
  getTotalPostsCountByCategory: statsService.getTotalPostsCountByCategory,
  
  // Engagement operations
  incrementViewCount: engagementService.incrementViewCount,
  incrementLikeCount: engagementService.incrementLikeCount,
  incrementShareCount: engagementService.incrementShareCount,
  
  // Comment operations
  addComment: commentService.addComment,
  getComments: commentService.getComments,
  deleteComment: commentService.deleteComment,
  
  // Utils
  mapPostToFrontend,
  getUserInfo
};

// Export the newsletter admin service that contains the same methods
export const newsletterAdminService = newsletterService;
