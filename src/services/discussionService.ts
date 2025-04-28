
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const discussionService = {
  async createDiscussionFromPost(postId: string, postContent: string, postTitle?: string) {
    try {
      // Create a new conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          title: postTitle || 'Discussão do Post',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Create initial message with post content
      const initialPrompt = `Vamos discutir sobre este post:\n\n${postContent}\n\nO que você acha sobre esse assunto?`;
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: initialPrompt,
          sender: 'user',
          mode: 'text'
        });

      if (messageError) throw messageError;

      // Link the post to the conversation
      const { error: linkError } = await supabase
        .from('post_discussions')
        .insert({
          post_id: postId,
          conversation_id: conversation.id
        });

      if (linkError) throw linkError;

      return { success: true, conversationId: conversation.id };
    } catch (error) {
      console.error('Error creating discussion:', error);
      return { success: false, error };
    }
  }
};
