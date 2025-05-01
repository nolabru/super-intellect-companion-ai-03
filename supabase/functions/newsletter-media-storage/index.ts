
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate file extension
function isValidFileType(fileName: string, mediaType: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (mediaType === 'image') {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  } else if (mediaType === 'video') {
    return ['mp4', 'webm', 'mov'].includes(extension);
  } else if (mediaType === 'audio') {
    return ['mp3', 'wav', 'ogg'].includes(extension);
  }
  
  return false;
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
    
    // Check if user is authenticated and is admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Acesso apenas para administradores' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get form data from request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mediaType = formData.get('mediaType') as string;
    
    if (!file || !mediaType) {
      return new Response(JSON.stringify({ error: 'Arquivo ou tipo de mídia não fornecido' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate file type
    if (!isValidFileType(file.name, mediaType)) {
      return new Response(JSON.stringify({ 
        error: `Tipo de arquivo inválido para mídia ${mediaType}` 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check file size (10MB limit)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      return new Response(JSON.stringify({ 
        error: 'Arquivo muito grande. Limite de 10MB.' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a unique file name
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `newsletter/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Make sure the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'media')) {
      const { error: bucketError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError) {
        throw new Error(`Error creating bucket: ${bucketError.message}`);
      }
      console.log(`Bucket media created successfully`);
    }
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);
      
    const publicUrl = urlData.publicUrl;
    
    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl: publicUrl,
        mediaType: mediaType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in newsletter media storage function:', error);
    
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
