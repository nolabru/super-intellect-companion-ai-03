
-- Function to get Google tokens for a user
CREATE OR REPLACE FUNCTION public.get_google_tokens_for_user(user_id_param UUID)
RETURNS SETOF public.user_google_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.user_google_tokens
  WHERE user_id = user_id_param;
END;
$$;

-- Function to delete Google tokens for a user
CREATE OR REPLACE FUNCTION public.delete_google_tokens_for_user(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_google_tokens
  WHERE user_id = user_id_param;
END;
$$;
