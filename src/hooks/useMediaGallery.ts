
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaItem {
  id: string;
  created_at: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'audio';
  prompt: string;
  thumbnail_url?: string;
}

export function useMediaGallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    mediaType: '' as '' | 'image' | 'video' | 'audio' | 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
    searchQuery: '',
  });

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }
      
      // Build query - using type assertion to bypass type checking
      // This is necessary until we can update the database schema types
      const supabaseQuery = supabase
        .from('user_media' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.mediaType && filters.mediaType !== 'all') {
        supabaseQuery.eq('media_type', filters.mediaType);
      }
      
      if (filters.startDate) {
        supabaseQuery.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        supabaseQuery.lt('created_at', endDate.toISOString());
      }
      
      if (filters.searchQuery) {
        supabaseQuery.ilike('prompt', `%${filters.searchQuery}%`);
      }
      
      const { data, error: fetchError } = await supabaseQuery;
      
      if (fetchError) {
        console.error('Error fetching media:', fetchError);
        
        // Check if the error is because the table doesn't exist
        if (fetchError.code === '42P01') { // relation does not exist
          setMediaItems([]);
          setError('A tabela de mídia ainda não foi criada. Por favor, salve um item de mídia primeiro.');
        } else {
          throw fetchError;
        }
      } else {
        // Use type assertion to cast the data to MediaItem[]
        setMediaItems(data as MediaItem[]);
      }
    } catch (err) {
      console.error('Erro ao buscar itens de mídia:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar mídia');
      toast.error('Não foi possível carregar a galeria de mídia');
    } finally {
      setLoading(false);
    }
  };

  // Save a new media item
  const saveMediaItem = async (mediaUrl: string, mediaType: 'image' | 'video' | 'audio', prompt: string, thumbnailUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar autenticado para salvar mídia');
        return null;
      }
      
      // Check if the table exists by trying to select from it
      const { error: checkError } = await supabase
        .from('user_media' as any)
        .select('id')
        .limit(1);
      
      // If the table doesn't exist, create it
      if (checkError && checkError.code === '42P01') {
        // We'll just try to insert anyway, since we can't create tables from the client
        console.log('Table user_media does not exist, trying to insert anyway');
      }
      
      // Using type assertion to bypass type checking
      const { data, error } = await supabase
        .from('user_media' as any)
        .insert([{
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          prompt,
          thumbnail_url: thumbnailUrl
        }] as any)
        .select();
      
      if (error) {
        console.error('Error saving media item:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} salvo na galeria`);
        return data[0] as MediaItem;
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao salvar item de mídia:', err);
      toast.error('Não foi possível salvar o item na galeria');
      return null;
    }
  };
  
  // Delete a media item
  const deleteMediaItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_media' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMediaItems(mediaItems.filter(item => item.id !== id));
      toast.success('Item removido da galeria');
      return true;
    } catch (err) {
      console.error('Erro ao excluir item de mídia:', err);
      toast.error('Não foi possível excluir o item');
      return false;
    }
  };
  
  useEffect(() => {
    fetchMediaItems();
  }, [filters]);

  return {
    mediaItems,
    loading,
    error,
    filters,
    setFilters,
    fetchMediaItems,
    saveMediaItem,
    deleteMediaItem
  };
}
