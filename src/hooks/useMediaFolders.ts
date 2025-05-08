
import { useState, useEffect, useRef } from 'react';
import { MediaFolder } from '@/types/gallery';
import { toast } from 'sonner';

export const useMediaFolders = () => {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef<string | null>(null);

  // Mock fetch folders function
  const fetchFolders = async () => {
    setLoading(true);
    try {
      // Return empty mock data
      setFolders([]);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders (mock)');
    } finally {
      setLoading(false);
    }
  };

  // Mock create folder
  const createFolder = async (name: string, parentFolderId?: string): Promise<MediaFolder | null> => {
    try {
      const newFolder: MediaFolder = {
        id: 'mock-' + Date.now(),
        name,
        user_id: 'mock-user',
        parent_folder_id: parentFolderId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setFolders(prev => [...prev, newFolder]);
      toast.success('Folder created successfully (mock)');
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder (mock)');
      return null;
    }
  };

  // Mock rename folder
  const renameFolder = async (folderId: string, newName: string): Promise<boolean> => {
    try {
      // Update state
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, name: newName } : folder
      ));
      
      toast.success('Folder renamed successfully (mock)');
      return true;
    } catch (err) {
      console.error('Error renaming folder:', err);
      toast.error('Failed to rename folder (mock)');
      return false;
    }
  };

  // Mock delete folder
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
      const toastId = toast.loading('Deleting folder (mock)...');
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update state
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // Show success message
      toast.success('Folder deleted successfully (mock)', { id: toastId });
      
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder (mock)');
      return false;
    } finally {
      // Reset deletion state and reference with a slight delay
      setTimeout(() => {
        setDeleting(false);
        deletingRef.current = null;
      }, 500);
    }
  };

  // Mock move media to folder
  const moveMediaToFolder = async (mediaId: string, folderId: string | null): Promise<boolean> => {
    try {
      toast.success(folderId 
        ? 'Media moved to folder successfully (mock)' 
        : 'Media moved to root successfully (mock)');
      return true;
    } catch (err) {
      console.error('Error moving media to folder:', err);
      toast.error('Failed to move media (mock)');
      return false;
    }
  };

  // Load folders on component mount
  useEffect(() => {
    fetchFolders();
  }, []);

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
