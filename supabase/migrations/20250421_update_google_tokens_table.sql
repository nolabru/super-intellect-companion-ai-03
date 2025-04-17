
-- Add permissions_verified and last_verified_at columns if they don't exist
ALTER TABLE public.user_google_tokens 
ADD COLUMN IF NOT EXISTS permissions_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

