
-- Add a title column to the user_memory table
ALTER TABLE public.user_memory 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to have a title based on the key_name
UPDATE public.user_memory 
SET title = INITCAP(REPLACE(key_name, '_', ' '))
WHERE title IS NULL;
