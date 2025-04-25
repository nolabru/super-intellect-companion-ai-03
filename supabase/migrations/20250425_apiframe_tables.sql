-- Create apiframe_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.apiframe_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  media_type TEXT NOT NULL,
  media_url TEXT,
  error TEXT,
  params JSONB DEFAULT '{}'::jsonb,
  percentage INTEGER DEFAULT 0,
  reference_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_apiframe_tasks_task_id ON public.apiframe_tasks(task_id);

-- Create index on user_id for filtering by user
CREATE INDEX IF NOT EXISTS idx_apiframe_tasks_user_id ON public.apiframe_tasks(user_id);

-- Create media_ready_events table for realtime notifications
CREATE TABLE IF NOT EXISTS public.media_ready_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_media_ready_events_task_id ON public.media_ready_events(task_id);

-- Enable Row Level Security
ALTER TABLE public.apiframe_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_ready_events ENABLE ROW LEVEL SECURITY;

-- Create policies for apiframe_tasks
CREATE POLICY "Users can view their own tasks" 
  ON public.apiframe_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own tasks" 
  ON public.apiframe_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own tasks" 
  ON public.apiframe_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for media_ready_events
CREATE POLICY "Anyone can view media_ready_events" 
  ON public.media_ready_events 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Service role can insert media_ready_events" 
  ON public.media_ready_events 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.apiframe_tasks TO authenticated;
GRANT SELECT ON public.media_ready_events TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON public.apiframe_tasks TO service_role;
GRANT ALL ON public.media_ready_events TO service_role;
