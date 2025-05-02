# Supabase Edge Functions para ApiFrame

Este diretório contém as funções edge do Supabase para integração com a API do ApiFrame, que permite gerar imagens, vídeos e áudio usando diversos modelos de IA.

## Funções Disponíveis

### Geração de Mídia
- **apiframe-generate-image**: Gera imagens usando modelos como SDXL, Kandinsky, DeepFloyd e DALL-E
- **apiframe-generate-video**: Gera vídeos usando modelos como Kling AI, Hunyuan e Hailuo
- **apiframe-generate-audio**: Gera áudio usando modelos como ElevenLabs, OpenAI TTS e Coqui XTTS

### Gerenciamento de Tarefas
- **apiframe-task-status**: Verifica o status de uma tarefa em andamento
- **apiframe-task-cancel**: Cancela uma tarefa em andamento
- **apiframe-media-webhook**: Recebe notificações de conclusão de tarefas

## Configuração

Para configurar as funções edge, você precisa definir as seguintes variáveis de ambiente no Supabase:

```bash
# Chave de API do ApiFrame
APIFRAME_API_KEY=sua_chave_api_aqui

# Segredo para autenticação de webhooks
APIFRAME_WEBHOOK_SECRET=seu_segredo_aqui
```

## Tabelas do Banco de Dados

A integração utiliza as seguintes tabelas no banco de dados do Supabase:

### apiframe_tasks
Armazena informações sobre tarefas de geração de mídia.

### media_ready_events
Armazena eventos de conclusão de tarefas para notificações em tempo real.

O script SQL para criar essas tabelas está disponível em `supabase/migrations/20250425_apiframe_tables.sql`.

## Uso

### Geração de Imagem

```typescript
// No frontend
const result = await apiframeService.generateImage(
  "Uma paisagem montanhosa ao pôr do sol",
  "sdxl",
  { width: 1024, height: 1024 }
);

// Verificar status da tarefa
const status = await apiframeService.checkTaskStatus(result.taskId);
```

### Geração de Vídeo

```typescript
// No frontend
const result = await apiframeService.generateVideo(
  "Um astronauta flutuando no espaço",
  "kling-text",
  { duration: 3 }
);

// Verificar status da tarefa
const status = await apiframeService.checkTaskStatus(result.taskId);
```

### Geração de Áudio

```typescript
// No frontend
const result = await apiframeService.generateAudio(
  "Olá, como você está hoje?",
  "elevenlabs-v2",
  { voice_id: "EXAVITQu4vr4xnSDxMaL" }
);

// Verificar status da tarefa
const status = await apiframeService.checkTaskStatus(result.taskId);
```

### Cancelamento de Tarefa

```typescript
// No frontend
const result = await apiframeService.cancelTask(taskId);
```

### Inscrição para Atualizações em Tempo Real

```typescript
// No frontend
const subscription = apiframeService.subscribeToTaskUpdates((payload) => {
  console.log("Tarefa concluída:", payload);
  // Atualizar a interface do usuário com a mídia gerada
});

// Cancelar inscrição quando não for mais necessário
subscription.unsubscribe();
```

## Fluxo de Trabalho

1. O cliente envia uma solicitação para gerar mídia
2. A função edge cria uma tarefa no ApiFrame e retorna um ID de tarefa
3. O cliente pode verificar o status da tarefa periodicamente
4. Quando a tarefa é concluída, o ApiFrame envia uma notificação para o webhook
5. O webhook atualiza o status da tarefa no banco de dados e cria um evento de conclusão
6. O cliente recebe uma notificação em tempo real sobre a conclusão da tarefa

## Modelos Suportados

### Imagem
- sdxl: Stable Diffusion XL
- sdxl-turbo: SDXL Turbo
- kandinsky: Kandinsky
- deepfloyd: DeepFloyd
- dalle: DALL-E

### Vídeo
- kling-text: Kling AI (texto para vídeo)
- kling-image: Kling AI (imagem para vídeo)
- hunyuan-fast: Hunyuan Fast
- hunyuan-standard: Hunyuan Standard
- hailuo-text: Hailuo (texto para vídeo)
- hailuo-image: Hailuo (imagem para vídeo)

### Áudio
- elevenlabs-v2: ElevenLabs v2
- openai-tts-1: OpenAI TTS-1
- coqui-xtts: Coqui XTTS
