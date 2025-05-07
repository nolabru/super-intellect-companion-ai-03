
export interface MediaFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  parent_folder_id?: string | null;
}

export interface MediaItem {
  id: string;
  url?: string;
  media_url?: string;
  type?: 'image' | 'video' | 'audio';
  media_type?: 'image' | 'video' | 'audio';
  created_at: string;
  title?: string;
  description?: string;
  user_id: string;
  model_id?: string;
  prompt?: string;
  metadata?: Record<string, any>;
  folder_id?: string | null;
}
