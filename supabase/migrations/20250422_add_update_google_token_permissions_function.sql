
-- Create a function to update Google token permissions
CREATE OR REPLACE FUNCTION public.update_google_token_permissions(
  p_user_id UUID,
  p_permissions_verified BOOLEAN,
  p_last_verified_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_google_tokens
  SET 
    permissions_verified = p_permissions_verified,
    last_verified_at = p_last_verified_at,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
