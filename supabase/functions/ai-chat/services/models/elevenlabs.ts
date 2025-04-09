
// ElevenLabs Text-to-Speech API Service
import { logError } from "../../utils/logging.ts";

// Verifica se a chave API do ElevenLabs está configurada
export function verifyApiKey() {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY não configurada nas variáveis de ambiente");
  }
  return apiKey;
}

// Interface para os parametros do ElevenLabs
interface ElevenLabsParams {
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

// Função para gerar áudio a partir de texto
export async function generateSpeech(text: string, params: ElevenLabsParams = {}) {
  try {
    const apiKey = verifyApiKey();
    
    // Configurações padrão se não forem especificadas
    const voiceId = params.voiceId || "EXAVITQu4vr4xnSDxMaL"; // Sarah por padrão
    const model = params.model || "eleven_multilingual_v2";
    const stability = params.stability ?? 0.5;
    const similarityBoost = params.similarityBoost ?? 0.75;
    const style = params.style ?? 0;
    const speakerBoost = params.speakerBoost ?? true;
    
    console.log(`Gerando áudio com ElevenLabs. Texto: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`Voz: ${voiceId}, Modelo: ${model}`);
    
    // Preparar o corpo da solicitação
    const requestBody = {
      text,
      model_id: model,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: speakerBoost
      }
    };
    
    // Fazer a solicitação para a API do ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      let errorText = "";
      try {
        const errorJson = await response.json();
        errorText = JSON.stringify(errorJson);
      } catch {
        errorText = await response.text();
      }
      
      throw new Error(`Erro na API ElevenLabs: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    // Processar o áudio recebido
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    console.log("Áudio gerado com sucesso pelo ElevenLabs");
    
    // Retornar o conteúdo em formato adequado para a resposta
    return {
      content: `[Áudio gerado]: ElevenLabs TTS - "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      files: [audioDataUrl]
    };
  } catch (error) {
    console.error("Erro ao gerar áudio com ElevenLabs:", error);
    logError("ELEVENLABS_ERROR", { error: error.message });
    throw error;
  }
}
