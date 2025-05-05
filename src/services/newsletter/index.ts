
// This file re-exports from the new modular structure
import * as commentService from './commentService';
import * as postService from './postService';
import * as statsService from './statsService';
import * as engagementService from './engagement';
import * as queryService from './query';

// Service de usuário comum
export const newsletterService = {
  // Funcionalidades de consulta
  getPosts: queryService.getPosts,
  getPublishedPosts: queryService.getPublishedPosts,
  getPostsByUserId: queryService.getPostsByUserId,
  getPublishedPostsByUserId: queryService.getPublishedPostsByUserId,
  getPostsBySearchTerm: queryService.getPostsBySearchTerm,
  getPostsByCategory: queryService.getPostsByCategory,
  getPopularPosts: queryService.getPopularPosts,
  getRelatedPosts: queryService.getRelatedPosts,
  getPostById: postService.getPostById,
  
  // Funcionalidades de comentários
  getComments: commentService.getComments,
  addComment: commentService.addComment,
  deleteComment: commentService.deleteComment,
  
  // Funcionalidades de engajamento
  incrementViewCount: engagementService.incrementViewCount,
  incrementLikeCount: engagementService.incrementLikeCount,
  incrementShareCount: engagementService.incrementShareCount,
  hasUserLikedPost: engagementService.hasUserLikedPost,
  
  // Funcionalidades de posts (adicionadas aqui para o serviço comum)
  createPost: postService.createPost,
  updatePost: postService.updatePost,
  deletePost: postService.deletePost,
  publishPost: postService.publishPost,
  unpublishPost: postService.unpublishPost
};

// Service administrativo
export const newsletterAdminService = {
  // Herda todas as funcionalidades do newsletterService
  ...newsletterService,
  
  // Estatísticas administrativas
  getStats: statsService.getStats,
  getTopPosts: statsService.getTopPosts,
  getEngagementStats: statsService.getEngagementStats
};

// Also export the direct modules for more granular access
export { engagementService, queryService };
