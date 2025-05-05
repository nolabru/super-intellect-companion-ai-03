
// Export all query services
import * as postQueries from './postQueries';
import * as commentQueries from './commentQueries';
export * from './types';
export * from './postQueries';
export * from './commentQueries';

// Create an object export for backward compatibility
export const queryService = {
  ...postQueries,
  ...commentQueries,
  getPosts: postQueries.getPosts
};
