
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    // Verificar o segredo do webhook
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== "kling-webhook-secret") {
      console.error("Webhook secret inválido");
      return new Response(
        JSON.stringify({ error: "Webhook secret inválido" }),
        { status: 401 }
      );
    }

    // Analisar o webhook payload
    const payload = await req.json();
    console.log("Webhook recebido:", JSON.stringify(payload, null, 2));

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair informações do payload
    const taskId = payload.task_id;
    const status = payload.status;
    const percentage = payload.percentage || 0;
    const videoUrl = payload.video_url;
    const imageUrl = payload.image_url; // Add support for image_url

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "ID da tarefa não encontrado no payload" }),
        { status: 400 }
      );
    }

    // Atualizar o registro da tarefa
    const { data: existingTask, error: fetchError } = await supabase
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError || !existingTask) {
      console.error(`Tarefa ${taskId} não encontrada: ${fetchError?.message}`);
      return new Response(
        JSON.stringify({ error: "Tarefa não encontrada" }),
        { status: 404 }
      );
    }

    const updateData: any = {
      status: status,
      percentage: percentage,
      updated_at: new Date().toISOString()
    };

    // Adicionar URL da mídia se disponível (suporte tanto para vídeo quanto para imagem)
    if (videoUrl) {
      updateData.result_url = videoUrl;
      updateData.media_url = videoUrl;
    } else if (imageUrl) {
      updateData.result_url = imageUrl;
      updateData.media_url = imageUrl;
    }

    const { error: updateError } = await supabase
      .from("apiframe_tasks")
      .update(updateData)
      .eq("task_id", taskId);

    if (updateError) {
      console.error(`Erro ao atualizar status da tarefa: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar status: ${updateError.message}` }),
        { status: 500 }
      );
    }

    // Se a mídia estiver pronta, salvar no media_ready_events para notificar o frontend
    if (status === "finished" && (videoUrl || imageUrl)) {
      const mediaUrl = videoUrl || imageUrl;
      const mediaType = videoUrl ? "video" : "image";
      
      const { error: insertError } = await supabase
        .from("media_ready_events")
        .insert({
          task_id: taskId,
          media_url: mediaUrl,
          media_type: mediaType,
          status: "completed"
        });

      if (insertError) {
        console.error(`Erro ao inserir evento de mídia pronta: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processado com sucesso" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(`Erro ao processar webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Erro ao processar webhook: ${error.message}` }),
      { status: 500 }
    );
  }
});
