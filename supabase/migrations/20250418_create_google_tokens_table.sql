
-- Tabela para armazenar tokens de acesso do Google
CREATE TABLE IF NOT EXISTS public.user_google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_google_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON public.user_google_tokens(user_id);

-- Política RLS para proteção dos dados
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios tokens
CREATE POLICY "Usuários podem ver apenas seus próprios tokens" ON public.user_google_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para permitir que a função Edge possa gerenciar os tokens
CREATE POLICY "Service role pode gerenciar todos os tokens" ON public.user_google_tokens
    USING (true)
    WITH CHECK (true);
