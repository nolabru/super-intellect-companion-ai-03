
import { PostgrestError } from '@supabase/supabase-js';
import { PostWithCounts, CommentWithUser, PostFilterParams } from '@/types/newsletter';

export interface PostsQueryResult {
  posts: PostWithCounts[];
  count: number;
  error: PostgrestError | null;
}

export interface PostQueryResult {
  post: PostWithCounts | null;
  error: PostgrestError | null;
}

export interface CommentsQueryResult {
  comments: CommentWithUser[];
  count: number;
  error: PostgrestError | null;
}

export interface CommentResult {
  comment: CommentWithUser | null;
  error: PostgrestError | null;
}
