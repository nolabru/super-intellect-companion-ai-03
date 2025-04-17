
import { OpenAI } from "https://esm.sh/openai@4.11.0";

const apiKey = Deno.env.get("OPENAI_API_KEY");
let openaiClient: OpenAI | null = null;

export function verifyApiKey(): string {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const key = verifyApiKey();
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

export async function generateText(content: string, modelId = "gpt-4o"): Promise<{ content: string }> {
  const client = getOpenAIClient();
  
  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: "user", content: content }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return { content: response.choices[0].message.content || "No content generated" };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function generateTextWithToolsSupport(
  content: string, 
  modelId = "gpt-4o", 
  systemPrompt?: string, 
  tools?: any[]
): Promise<{ content: string }> {
  const client = getOpenAIClient();
  
  try {
    // Preparar mensagens
    const messages = [];
    
    // Adicionar system prompt se fornecido
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    // Adicionar mensagem do usuário
    messages.push({ role: "user", content: content });
    
    // Configurar opções do modelo
    const options: any = {
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    };
    
    // Adicionar ferramentas se fornecidas
    if (tools && tools.length > 0) {
      // Extrair configurações das ferramentas (sem o exec function)
      const toolsConfig = tools.map(tool => ({
        type: tool.type,
        function: tool.function
      }));
      
      options.tools = toolsConfig;
      options.tool_choice = "auto";
    }
    
    let response = await client.chat.completions.create(options);
    
    // Processar chamadas de ferramentas se necessário
    if (response.choices[0]?.message?.tool_calls?.length > 0) {
      const tool_calls = response.choices[0].message.tool_calls;
      console.log("[OpenAI] Tool calls detected:", tool_calls.length);
      
      // Adicionar a resposta do assistente com a chamada da ferramenta
      messages.push(response.choices[0].message);
      
      // Executar cada chamada de ferramenta
      for (const tool_call of tool_calls) {
        try {
          const function_name = tool_call.function.name;
          const function_args = JSON.parse(tool_call.function.arguments);
          
          console.log(`[OpenAI] Executing tool: ${function_name} with args:`, function_args);
          
          // Encontrar a função de execução correspondente
          const tool = tools?.find(t => t.function.name === function_name);
          let function_response;
          
          if (tool?.exec) {
            // Chamar a função de execução
            function_response = await tool.exec(function_args);
          } else {
            function_response = { error: `Tool executor not found for ${function_name}` };
          }
          
          console.log(`[OpenAI] Tool response:`, function_response);
          
          // Adicionar resultado da ferramenta às mensagens
          messages.push({
            role: "tool",
            tool_call_id: tool_call.id,
            name: function_name,
            content: JSON.stringify(function_response)
          });
        } catch (toolError) {
          console.error(`[OpenAI] Error executing tool ${tool_call.function.name}:`, toolError);
          
          // Adicionar erro da ferramenta às mensagens
          messages.push({
            role: "tool",
            tool_call_id: tool_call.id,
            name: tool_call.function.name,
            content: JSON.stringify({ error: toolError.message || "Error executing tool" })
          });
        }
      }
      
      // Obter resposta final do assistente com os resultados das ferramentas
      response = await client.chat.completions.create({
        model: modelId,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      });
    }

    return { content: response.choices[0].message.content || "No content generated" };
  } catch (error) {
    console.error("OpenAI API Error with tools:", error);
    throw error;
  }
}

export async function processImage(content: string, imageUrl: string, modelId = "gpt-4o"): Promise<{ content: string }> {
  const client = getOpenAIClient();
  
  try {
    // Verificar se o modelo suporta análise de imagem
    if (modelId !== "gpt-4-vision-preview" && modelId !== "gpt-4o") {
      modelId = "gpt-4o"; // Fallback para um modelo com suporte a visão
    }
    
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: content },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1024
    });

    return { content: response.choices[0].message.content || "No analysis generated" };
  } catch (error) {
    console.error("OpenAI Vision API Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, modelId = "dall-e-3"): Promise<{ content: string, files: string[] }> {
  const client = getOpenAIClient();
  
  try {
    const response = await client.images.generate({
      model: modelId,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    return { 
      content: `[Imagem gerada]: ${imageUrl}\n\nImagem gerada com base no prompt: "${prompt}"`, 
      files: [imageUrl] 
    };
  } catch (error) {
    console.error("DALL-E API Error:", error);
    throw error;
  }
}
