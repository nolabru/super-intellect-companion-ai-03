
-- Function to delete a conversation and all its messages in a single transaction
CREATE OR REPLACE FUNCTION public.delete_conversation_with_messages(conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete all messages for this conversation
  DELETE FROM public.messages
  WHERE conversation_id = delete_conversation_with_messages.conversation_id;
  
  -- Delete the conversation
  DELETE FROM public.conversations
  WHERE id = delete_conversation_with_messages.conversation_id;
  
  -- Return successfully
  RETURN;
END;
$$;
