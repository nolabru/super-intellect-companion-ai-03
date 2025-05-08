
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MediaFolder } from '@/types/gallery';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useMediaFolders = () => {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef<string | null>(null);
  const { user } = useAuth();

  // Fetch user's folders
  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      
      setFolders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  // Create a new folder
  const createFolder = async (name: string, parentFolderId?: string): Promise<MediaFolder | null> => {
    if (!user) {
      toast.error('You must be logged in to create folders');
      return null;
    }
    
    try {
      const newFolder = {
        name,
        user_id: user.id,
        parent_folder_id: parentFolderId || null
      };
      
      const { data, error } = await supabase
        .from('media_folders')
        .insert([newFolder])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFolders(prev => [...prev, data]);
        toast.success('Folder created successfully');
        return data;
      }
      
      return null;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder');
      return null;
    }
  };

  // Rename a folder
  const renameFolder = async (folderId: string, newName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('media_folders')
        .update({ name: newName })
        .eq('id', folderId);
      
      if (error) throw error;
      
      // Update state
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, name: newName } : folder
      ));
      
      return true;
    } catch (err) {
      console.error('Error renaming folder:', err);
      toast.error('Failed to rename folder');
      return false;
    }
  };

  // Delete a folder
  const deleteFolder = async (folderId: string): Promise<boolean> => {
    // Prevent multiple deletion operations on the same folder
    if (deleting || deletingRef.current === folderId) {
      console.log(`Already deleting folder ${folderId}, ignoring duplicate request`);
      return false;
    }

    try {
      // Set deleting state and reference
      setDeleting(true);
      deletingRef.current = folderId;
      
      // Show deletion in progress toast
      const toastId = toast.loading('Deleting folder...');
      
      // First move all media in this folder back to root
      const { error: updateError } = await supabase
        .from('media_gallery')
        .update({ folder_id: null })
        .eq('folder_id', folderId);
      
      if (updateError) {
        toast.error('Failed to update media in folder', { id: toastId });
        throw updateError;
      }
      
      // Allow UI to update before deletion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then delete the folder
      const { error } = await supabase
        .from('media_folders')
        .delete()
        .eq('id', folderId);
      
      if (error) {
        toast.error('Failed to delete folder', { id: toastId });
        throw error;
      }
      
      // Update state - do this before showing success to prevent UI jumps
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // Show success message
      toast.success('Folder deleted successfully', { id: toastId });
      
      // Add a small delay to allow state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder: ' + 
        (err instanceof Error ? err.message : 'Unknown error'));
      return false;
    } finally {
      // Reset deletion state and reference with a slight delay
      setTimeout(() => {
        setDeleting(false);
        deletingRef.current = null;
      }, 500);
    }
  };

  // Move a media item to a folder
  const moveMediaToFolder = async (mediaId: string, folderId: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('media_gallery')
        .update({ folder_id: folderId })
        .eq('id', mediaId);
      
      if (error) throw error;
      
      toast.success(folderId 
        ? 'Media moved to folder successfully' 
        : 'Media moved to root successfully');
      return true;
    } catch (err) {
      console.error('Error moving media to folder:', err);
      toast.error('Failed to move media');
      return false;
    }
  };

  // Load folders on component mount
  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  return {
    folders,
    loading,
    error,
    deleting,
    createFolder,
    renameFolder,
    deleteFolder,
    moveMediaToFolder,
    refreshFolders: fetchFolders
  };
};
