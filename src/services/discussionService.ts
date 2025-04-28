
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const discussionService = {
  async createDiscussionFromPost(postId: string, postContent: string, postTitle?: string, mediaUrl?: string, mediaType?: string) {
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
      
      // Create user message object
      const messageData: any = {
        conversation_id: conversation.id,
        content: initialPrompt,
        sender: 'user',
        mode: 'text'
      };
      
      // If there's media, include it in the message
      if (mediaUrl && mediaType) {
        messageData.files = [mediaUrl];
        
        // Não estamos usando media_type, mas sim definindo o modo conforme necessário
        if (mediaType === 'image' || mediaType === 'video') {
          messageData.files = [mediaUrl];
        }
      }
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

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
