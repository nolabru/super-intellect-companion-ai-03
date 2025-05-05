
-- Create ideogram_generations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ideogram_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  style_type TEXT,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create index on user_id for filtering by user
CREATE INDEX IF NOT EXISTS idx_ideogram_generations_user_id ON public.ideogram_generations(user_id);

-- Enable Row Level Security
ALTER TABLE public.ideogram_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for ideogram_generations
CREATE POLICY "Users can view their own generations" 
  ON public.ideogram_generations 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own generations" 
  ON public.ideogram_generations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.ideogram_generations TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON public.ideogram_generations TO service_role;
