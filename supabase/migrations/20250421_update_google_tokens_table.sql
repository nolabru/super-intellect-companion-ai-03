
-- Add permissions_verified and last_verified_at columns to user_google_tokens table
ALTER TABLE IF EXISTS public.user_google_tokens 
ADD COLUMN IF NOT EXISTS permissions_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Update existing rows to have default values
UPDATE public.user_google_tokens
SET 
  permissions_verified = false,
  last_verified_at = now()
WHERE permissions_verified IS NULL;
