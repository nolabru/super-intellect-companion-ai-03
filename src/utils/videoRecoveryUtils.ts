
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Checks if a video URL is valid and accessible
 * @param url The URL to check
 * @returns Promise<boolean> True if the URL is valid and accessible
 */
export const isVideoUrlValid = async (url: string): Promise<boolean> => {
  if (!url) return false;

  try {
    // Cache buster to prevent browser caching the result
    const cacheBuster = `?cb=${Date.now()}`;
    const urlWithCacheBuster = url.includes('?') 
      ? `${url}&cb=${Date.now()}` 
      : `${url}${cacheBuster}`;
    
    const response = await fetch(urlWithCacheBuster, {
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'cors',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // For videos, make sure it returns a video content type
    const contentType = response.headers.get('Content-Type');
    const isVideo = contentType && contentType.includes('video');
    
    // Check file size header is present
    const contentLength = response.headers.get('Content-Length');
    const hasContent = contentLength && parseInt(contentLength) > 0;
    
    return response.ok && (isVideo || hasContent);
  } catch (error) {
    console.error('Error checking video URL validity:', error);
    return false;
  }
};

/**
 * Attempts multiple strategies to recover a video based on its URL or task ID
 * @param url Current video URL (may be invalid)
 * @param taskId Optional task ID
 * @returns Object with success status and recovered URL
 */
export const recoverVideo = async (url: string, taskId?: string): Promise<{
  success: boolean;
  url?: string;
  message?: string;
}> => {
  try {
    // If we have both URL and task ID, first check if the URL is valid
    if (url) {
      const isValid = await isVideoUrlValid(url);
      if (isValid) {
        return { success: true, url };
      }
    }

    // If URL is invalid or not provided, and we have taskId, try to recover from database
    if (taskId) {
      // Check database for this task ID
      const { data: taskData, error: taskError } = await supabase
        .from('apiframe_tasks')
        .select('media_url, status')
        .eq('task_id', taskId)
        .maybeSingle();
        
      if (taskError) {
        console.error('Error checking task in database:', taskError);
      } else if (taskData?.media_url) {
        // Verify the media URL is valid
        const isValid = await isVideoUrlValid(taskData.media_url);
        if (isValid) {
          return { success: true, url: taskData.media_url };
        }
      }
      
      // Check in piapi_tasks table if not found in apiframe_tasks
      const { data: piapiData, error: piapiError } = await supabase
        .from('piapi_tasks')
        .select('media_url, status')
        .eq('task_id', taskId)
        .maybeSingle();
        
      if (piapiError) {
        console.error('Error checking task in piapi_tasks:', piapiError);
      } else if (piapiData?.media_url) {
        // Verify the media URL is valid
        const isValid = await isVideoUrlValid(piapiData.media_url);
        if (isValid) {
          return { success: true, url: piapiData.media_url };
        }
      }

      // If we didn't find a valid URL in the database, try alternative URL formats
      const possibleUrls = [
        `https://storage.googleapis.com/piapi-videos/${taskId}.mp4`,
        `https://storage.googleapis.com/piapi-results/${taskId}.mp4`,
        `https://assets.midjourney.video/${taskId}.mp4`,
        `https://storage.googleapis.com/tech-ai-videos/${taskId}.mp4`,
        `https://api.apiframe.com/output/${taskId}.mp4`,
        `https://cdn.klingai.com/bs2/upload-kling-api/${taskId.substring(0, 10)}/${taskId}.mp4`,
      ];
      
      // Try each possible URL
      for (const possibleUrl of possibleUrls) {
        const isValid = await isVideoUrlValid(possibleUrl);
        if (isValid) {
          // Register this URL in the database for future reference
          await registerRecoveredVideo(
            possibleUrl,
            'Recuperado automaticamente',
            undefined,
            taskId
          );
          
          return { success: true, url: possibleUrl };
        }
      }
      
      // If we still haven't found a valid URL, try more aggressive patterns
      // For example, try partial matches for the beginning of the task ID
      if (taskId.length > 12) {
        const partialId = taskId.substring(0, 12);
        const { data: eventsData, error: eventsError } = await supabase
          .from('media_ready_events')
          .select('media_url')
          .ilike('task_id', `${partialId}%`)
          .limit(5);
          
        if (!eventsError && eventsData && eventsData.length > 0) {
          for (const event of eventsData) {
            if (event.media_url) {
              const isValid = await isVideoUrlValid(event.media_url);
              if (isValid) {
                return { success: true, url: event.media_url };
              }
            }
          }
        }
      }
    }
    
    return { 
      success: false, 
      message: 'Não foi possível recuperar o vídeo após várias tentativas' 
    };
  } catch (error) {
    console.error('Error recovering video:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

/**
 * Registers a recovered video in the database
 * @param mediaUrl URL of the recovered video
 * @param prompt Description or prompt used to generate the video
 * @param userId Optional user ID
 * @param taskId Optional task ID
 * @returns Success status
 */
export const registerRecoveredVideo = async (
  mediaUrl: string,
  prompt: string,
  userId?: string,
  taskId?: string
): Promise<boolean> => {
  try {
    if (!mediaUrl) {
      console.error('[registerRecoveredVideo] URL de mídia não fornecida');
      return false;
    }
    
    console.log(`[registerRecoveredVideo] Registrando vídeo recuperado: ${mediaUrl}`);
    
    // First, save to media gallery for user access
    const { error: galleryError } = await supabase
      .from('media_gallery')
      .insert({
        media_url: mediaUrl,
        prompt,
        media_type: 'video',
        model_id: 'recuperado',
        user_id: userId
      });
    
    if (galleryError) {
      console.error('[registerRecoveredVideo] Erro ao salvar na galeria:', galleryError);
      // Continue even if gallery insert fails
    } else {
      toast.success("Vídeo registrado na galeria");
    }
    
    // If we have a task ID, update or insert in apiframe_tasks
    if (taskId) {
      // Try to update existing record first
      const { data: existingTask, error: queryError } = await supabase
        .from('apiframe_tasks')
        .select('id')
        .eq('task_id', taskId)
        .maybeSingle();
        
      if (!queryError && existingTask) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('apiframe_tasks')
          .update({
            media_url: mediaUrl,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('task_id', taskId);
          
        if (updateError) {
          console.error('[registerRecoveredVideo] Erro ao atualizar task:', updateError);
        } else {
          console.log('[registerRecoveredVideo] Task atualizada com sucesso');
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('apiframe_tasks')
          .insert({
            task_id: taskId,
            media_url: mediaUrl,
            status: 'completed',
            media_type: 'video',
            model: 'recuperado',
            prompt: prompt
          });
          
        if (insertError) {
          console.error('[registerRecoveredVideo] Erro ao inserir task:', insertError);
        } else {
          console.log('[registerRecoveredVideo] Task inserida com sucesso');
        }
        
        // Also try to register in media_ready_events for webhook simulation
        const { error: eventError } = await supabase
          .from('media_ready_events')
          .insert({
            task_id: taskId,
            media_url: mediaUrl,
            media_type: 'video',
            prompt: prompt,
            model: 'recuperado'
          });
          
        if (eventError) {
          console.error('[registerRecoveredVideo] Erro ao inserir evento:', eventError);
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error('[registerRecoveredVideo] Erro ao registrar vídeo recuperado:', err);
    return false;
  }
};

/**
 * Gets a list of possible URLs for a task ID
 * @param taskId Task ID to generate URLs for
 * @returns Array of possible URLs
 */
export const getPossibleVideoUrls = (taskId: string): string[] => {
  if (!taskId) return [];
  
  return [
    `https://storage.googleapis.com/piapi-videos/${taskId}.mp4`,
    `https://storage.googleapis.com/piapi-results/${taskId}.mp4`,
    `https://assets.midjourney.video/${taskId}.mp4`,
    `https://storage.googleapis.com/tech-ai-videos/${taskId}.mp4`,
    `https://api.apiframe.com/output/${taskId}.mp4`,
    `https://cdn.klingai.com/bs2/upload-kling-api/${taskId.substring(0, 10)}/${taskId}.mp4`
  ];
};
