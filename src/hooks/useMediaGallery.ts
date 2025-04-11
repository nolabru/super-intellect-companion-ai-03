
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from '@/components/ModeSelector';

export const useMediaGallery = () => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  /**
   * Downloads and stores media in Supabase Storage
   */
  const downloadAndStoreMedia = async (
    mediaUrl: string,
    mediaType: ChatMode,
    userId: string
  ): Promise<string | null> => {
    try {
      console.log('Starting media download:', mediaUrl);
      
      // Validate URL
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        throw new Error('Invalid media URL');
      }

      // Get appropriate extension based on media type
      let fileExtension = '';
      if (mediaType === 'image') {
        fileExtension = '.png';
      } else if (mediaType === 'video') {
        fileExtension = '.mp4';
      } else if (mediaType === 'audio') {
        fileExtension = '.mp3';
      }

      // Generate unique filename
      const fileName = `${uuidv4()}${fileExtension}`;
      const bucketName = 'media_gallery';
      const filePath = `${userId}/${fileName}`;

      // Check if bucket exists and create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('Creating media bucket:', bucketName);
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (bucketError) throw bucketError;
      }

      // Download the file
      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        throw new Error(`Error downloading media: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL of the file
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      if (!publicUrlData.publicUrl) {
        throw new Error('Could not get public URL for the file');
      }
      
      console.log('Media successfully saved to Storage:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
      
    } catch (error) {
      console.error('Error downloading and storing media:', error);
      throw error;
    }
  };

  const saveMediaToGallery = async (
    mediaUrl: string,
    prompt: string,
    mediaType: ChatMode,
    modelId?: string,
    metadata: any = {}
  ) => {
    try {
      if (saving) return; // Prevent multiple simultaneous saves
      
      setSaving(true);

      // Check if user is authenticated
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('User not authenticated, not saving to gallery');
        return;
      }

      // Validate media URL
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        throw new Error('Invalid media URL');
      }

      // Download media and save to Storage (for external URLs)
      let storageUrl = mediaUrl;
      if (mediaUrl.startsWith('http') && !mediaUrl.includes(window.location.hostname)) {
        try {
          const savedUrl = await downloadAndStoreMedia(mediaUrl, mediaType, userData.user.id);
          if (savedUrl) {
            storageUrl = savedUrl;
          }
        } catch (error) {
          console.error('Error storing media in Storage:', error);
          // Continue with original URL if download fails
        }
      }

      // Prepare data for insertion
      const mediaData = {
        id: uuidv4(),
        user_id: userData.user.id,
        media_url: storageUrl,
        prompt,
        media_type: mediaType,
        model_id: modelId,
        metadata: {
          ...metadata,
          saved_at: new Date().toISOString(),
          source: 'chat',
          original_url: mediaUrl !== storageUrl ? mediaUrl : undefined
        }
      };

      // Insert into media table
      const { error } = await supabase
        .from('media_gallery')
        .insert([mediaData]);

      if (error) throw error;

      console.log('Media saved to gallery successfully');
      toast({
        title: "Success",
        description: "Media saved to gallery successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving media to gallery:', error);
      toast({
        title: "Error",
        description: "Could not save media to gallery: " + 
          (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes media from gallery and storage
   */
  const deleteMediaFromGallery = async (mediaId: string): Promise<boolean> => {
    try {
      if (deleting) return false; // Prevent multiple deletion attempts
      
      setDeleting(true);

      // Get the media item to find out storage path
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media_gallery')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        console.error('Error fetching media item:', fetchError);
        throw fetchError;
      }

      // Check if this media is stored in our storage
      if (mediaItem.media_url && mediaItem.media_url.includes('media_gallery')) {
        try {
          // Extract the path from the URL
          const storageUrl = new URL(mediaItem.media_url);
          const pathParts = storageUrl.pathname.split('/');
          // The path should be something like /storage/v1/object/public/media_gallery/user_id/filename
          // We need to extract the part after media_gallery/
          const bucketPath = pathParts.slice(pathParts.indexOf('media_gallery') + 1).join('/');
          
          if (bucketPath) {
            console.log('Removing file from storage:', bucketPath);
            // Delete the file from storage
            const { error: storageError } = await supabase.storage
              .from('media_gallery')
              .remove([bucketPath]);
              
            if (storageError) {
              console.warn('Failed to delete file from storage:', storageError);
              // Continue with database deletion even if storage deletion fails
            }
          }
        } catch (storageError) {
          console.warn('Error parsing storage URL:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete the record from the database
      const { error: deleteError } = await supabase
        .from('media_gallery')
        .delete()
        .eq('id', mediaId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      console.error('Error deleting media from gallery:', error);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    saveMediaToGallery,
    deleteMediaFromGallery,
    saving,
    deleting
  };
};
