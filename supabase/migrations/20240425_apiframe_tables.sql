
-- Create table for storing APIframe task information
CREATE TABLE IF NOT EXISTS public.apiframe_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  media_type TEXT NOT NULL,
  media_url TEXT,
  params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS apiframe_tasks_task_id_idx ON public.apiframe_tasks (task_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS apiframe_tasks_status_idx ON public.apiframe_tasks (status);

-- Add comment to the table
COMMENT ON TABLE public.apiframe_tasks IS 'Stores information about media generation tasks from APIframe.ai';
