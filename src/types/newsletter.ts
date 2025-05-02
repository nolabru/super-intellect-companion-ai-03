
// Define the base post type
export interface NewsletterPost {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  media_url?: string | null;
  media_type?: string | null;
  is_published: boolean;
  published_at?: string | null;
  view_count?: number;
  like_count?: number;
  share_count?: number;
}

// Extended type with additional information
export interface PostWithStats extends NewsletterPost {
  user_id: string;
  published_at: string | null;
  view_count: number;
  like_count: number;
  share_count: number;
  likes_count: number; // For backward compatibility
  comments_count: number;
  user_has_liked: boolean;
}

// Comment type
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// Type for the newsletter service
export interface NewsletterServiceType {
  getPosts(): Promise<PostWithStats[]>;
  getPostById(id: string): Promise<PostWithStats>;
  likePost(postId: string): Promise<boolean>;
  getComments?(postId: string): Promise<Comment[]>;
  addComment?(postId: string, content: string): Promise<Comment>;
  deleteComment?(commentId: string): Promise<boolean>;
  incrementViewCount?(postId: string): Promise<boolean>;
}

// Type for the admin newsletter service
export interface AdminNewsletterServiceType {
  getAllPosts(): Promise<PostWithStats[]>;
  createPost(postData: { title: string; content: string; mediaUrl?: string; mediaType?: string; isPublished?: boolean; }): Promise<PostWithStats>;
  updatePost(postId: string, postData: Partial<PostWithStats>): Promise<PostWithStats>;
  deletePost(postId: string): Promise<boolean>;
}

// Define the properties for the NewsletterPost component
export interface NewsletterPostProps {
  post: PostWithStats;
  onDelete?: (postId: string) => void;
  isAdmin?: boolean; // Optional prop to show admin actions
}
