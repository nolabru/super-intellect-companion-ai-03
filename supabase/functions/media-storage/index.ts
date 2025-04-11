
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to download file from URL
async function downloadFile(url: string): Promise<ArrayBuffer> {
  try {
    // Handle data:image URLs
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format');
      }
      
      console.log(`Processando imagem base64 com tipo MIME: ${matches[1]}`);
      const base64Data = matches[2];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    }
    
    // Handle regular URLs
    console.log(`Baixando arquivo da URL: ${url.substring(0, 100)}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

// Helper function to determine file extension from URL or content type
function getFileExtension(url: string, contentType?: string): string {
  if (contentType) {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav'
    };
    
    const extension = extensionMap[contentType];
    if (extension) return extension;
  }
  
  // Check if it's a data URL
  if (url.startsWith('data:')) {
    const mimeType = url.split(';')[0].split(':')[1];
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    
    const extension = extensionMap[mimeType];
    if (extension) return extension;
  }
  
  // Extract from URL
  const urlExtension = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (urlExtension && urlExtension.length < 5) return urlExtension;
  
  // Default extensions based on URL patterns
  if (url.includes('video')) return 'mp4';
  if (url.includes('audio')) return 'mp3';
  return 'jpg'; // Default to jpg
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client using service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service key not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get URL from request
    const { mediaUrl, fileName, contentType, userId, conversationId, mode } = await req.json();
    
    if (!mediaUrl) {
      throw new Error('Media URL is required');
    }
    
    console.log(`Recebida solicitação para armazenar mídia${mediaUrl.startsWith('data:') ? ' (base64)' : ''}`);
    
    // Determine content type
    let detectedContentType = contentType;
    if (mediaUrl.startsWith('data:')) {
      detectedContentType = mediaUrl.split(';')[0].split(':')[1] || contentType;
      console.log(`Tipo de conteúdo detectado da URL de dados: ${detectedContentType}`);
    }
    
    // Create a unique file name
    const timestamp = new Date().getTime();
    const extension = getFileExtension(mediaUrl, detectedContentType);
    const storagePath = fileName || `${timestamp}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
    const bucketName = 'ai-generated-media';
    
    // Download the media file
    console.log(`Baixando mídia...`);
    const fileData = await downloadFile(mediaUrl);
    console.log(`Mídia baixada com sucesso, tamanho: ${fileData.byteLength} bytes`);
    
    // Make sure the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucketName)) {
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError) {
        throw new Error(`Erro ao criar bucket: ${bucketError.message}`);
      }
      console.log(`Bucket ${bucketName} criado com sucesso`);
    }
    
    // Upload file to Supabase Storage
    console.log(`Fazendo upload do arquivo para bucket ${bucketName} em ${storagePath}`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileData, {
        contentType: detectedContentType || getContentTypeFromExtension(extension),
        upsert: true
      });
    
    if (error) {
      throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
      
    const publicUrl = urlData.publicUrl;
    
    console.log(`Arquivo armazenado com sucesso. URL pública: ${publicUrl}`);
    
    // Save metadata in the database if userId is provided
    if (userId) {
      const { error: metadataError } = await supabase
        .from('media_gallery')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          file_path: storagePath,
          media_url: publicUrl,
          original_url: mediaUrl.startsWith('data:') ? null : mediaUrl,
          media_type: mode || getMediaTypeFromExtension(extension),
          created_at: new Date().toISOString()
        });
      
      if (metadataError) {
        console.error(`Erro ao salvar metadados: ${metadataError.message}`);
        // Continue even if metadata save fails
      } else {
        console.log(`Metadados salvos com sucesso`);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        publicUrl,
        storagePath
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Erro na função de armazenamento de mídia:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Helper to get content type from extension
function getContentTypeFromExtension(extension: string): string {
  const contentTypeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav'
  };
  
  return contentTypeMap[extension.toLowerCase()] || 'application/octet-stream';
}

// Helper to get media type from extension
function getMediaTypeFromExtension(extension: string): string {
  const videoExtensions = ['mp4', 'mov', 'webm'];
  const audioExtensions = ['mp3', 'wav', 'ogg'];
  
  if (videoExtensions.includes(extension.toLowerCase())) return 'video';
  if (audioExtensions.includes(extension.toLowerCase())) return 'audio';
  return 'image';
}
