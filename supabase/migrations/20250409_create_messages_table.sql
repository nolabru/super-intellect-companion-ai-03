
-- Create a table for storing chat messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  model TEXT,
  mode TEXT NOT NULL,
  files TEXT[],
  media_url TEXT
);

-- Add RLS policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy for selecting messages: users can only view messages in their own conversations
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND c.user_id = auth.uid()
  )
);

-- Policy for inserting messages: users can only add messages to their own conversations
CREATE POLICY "Users can insert their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND c.user_id = auth.uid()
  )
);

-- Create a trigger to update the conversation's updated_at timestamp
-- when a new message is added to the conversation
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_conversation_after_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Create an index on conversation_id for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
