
-- Function to safely increment a numeric counter
CREATE OR REPLACE FUNCTION public.increment_counter(
  row_id UUID,
  counter_column TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_value INTEGER;
BEGIN
  -- Get the current value
  EXECUTE format('SELECT %I FROM newsletter_posts WHERE id = $1', counter_column)
  INTO current_value
  USING row_id;
  
  -- If null, start at 0
  IF current_value IS NULL THEN
    current_value := 0;
  END IF;
  
  -- Return incremented value
  RETURN current_value + 1;
END;
$$;
