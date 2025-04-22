
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_id, status, result } = await req.json();
    
    if (!task_id) {
      return new Response(
        JSON.stringify({ error: "task_id é obrigatório" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Recebido webhook para tarefa ${task_id} com status ${status}`);
    
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Obter informações da tarefa do Supabase
    const { data: taskData, error: fetchError } = await supabaseClient
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", task_id)
      .single();

    if (fetchError) {
      console.error(`Erro ao buscar tarefa: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ error: "Tarefa não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Atualizar status da tarefa
    const { error: updateError } = await supabaseClient
      .from("piapi_tasks")
      .update({ 
        status: status,
        result: result || null,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", task_id);

    if (updateError) {
      console.error(`Erro ao atualizar tarefa: ${updateError.message}`);
    }

    // Se o status é completed, processar e salvar o arquivo de mídia
    if (status === "completed" && result && result.output && result.output.length > 0) {
      const mediaUrl = result.output[0].url;
      const mediaType = taskData.media_type;
      
      if (mediaUrl) {
        try {
          // Baixar o arquivo de mídia
          console.log(`Baixando mídia de ${mediaUrl}`);
          const mediaResponse = await fetch(mediaUrl);
          
          if (!mediaResponse.ok) {
            throw new Error(`Falha ao baixar mídia: ${mediaResponse.statusText}`);
          }
          
          const mediaBlob = await mediaResponse.blob();
          
          // Determinar extensão do arquivo
          let fileExtension = ".bin";
          const contentType = mediaResponse.headers.get("content-type");
          
          if (contentType) {
            if (contentType.includes("image")) {
              fileExtension = contentType.includes("png") ? ".png" : ".jpg";
            } else if (contentType.includes("video")) {
              fileExtension = ".mp4";
            } else if (contentType.includes("audio")) {
              fileExtension = ".mp3";
            }
          } else {
            // Fallback baseado no tipo de mídia
            if (mediaType === "image") fileExtension = ".png";
            else if (mediaType === "video") fileExtension = ".mp4";
            else if (mediaType === "audio") fileExtension = ".mp3";
          }
          
          // Salvar no bucket adequado
          let storagePath = "";
          const fileName = `${task_id}${fileExtension}`;
          
          if (mediaType === "image") {
            storagePath = `images/${fileName}`;
          } else if (mediaType === "video") {
            storagePath = `videos/${fileName}`;
          } else if (mediaType === "audio") {
            storagePath = `audios/${fileName}`;
          }
          
          console.log(`Salvando mídia em ${storagePath}`);
          
          // Criar o bucket se ele não existir
          const { data: buckets } = await supabaseClient
            .storage
            .listBuckets();
            
          const mediaBucket = buckets?.find(b => b.name === 'media');
          
          if (!mediaBucket) {
            console.log('Criando bucket de mídia...');
            const { error: bucketError } = await supabaseClient
              .storage
              .createBucket('media', {
                public: true
              });
              
            if (bucketError) {
              console.error(`Erro ao criar bucket: ${bucketError.message}`);
            }
          }
          
          // Upload para Supabase Storage
          const { data: storageData, error: storageError } = await supabaseClient
            .storage
            .from("media")
            .upload(storagePath, mediaBlob, {
              contentType,
              upsert: true
            });
            
          if (storageError) {
            throw new Error(`Falha ao fazer upload para storage: ${storageError.message}`);
          }
          
          // Obter URL pública
          const { data: publicUrlData } = supabaseClient
            .storage
            .from("media")
            .getPublicUrl(storagePath);
            
          const publicUrl = publicUrlData.publicUrl;
          
          // Atualizar tarefa com URL da mídia armazenada
          await supabaseClient
            .from("piapi_tasks")
            .update({ 
              media_url: publicUrl
            })
            .eq("task_id", task_id);
          
          // Transmitir conclusão via Realtime
          await supabaseClient
            .from("media_ready_events")
            .insert({
              task_id,
              media_type: mediaType,
              media_url: publicUrl,
              prompt: taskData.prompt,
              model: taskData.model
            });
            
          console.log(`Mídia processada e salva com sucesso: ${publicUrl}`);
        } catch (processError) {
          console.error(`Erro ao processar mídia: ${processError.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook processado para tarefa ${task_id}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Erro ao processar webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
