
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface CommentInputProps {
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  placeholder = "Adicione um comentário...", 
  disabled = false,
  className
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('O comentário não pode estar vazio');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(comment);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn("flex items-end gap-2 mt-4", className)}
    >
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] bg-inventu-darker/80 border-white/10 resize-none text-white"
        disabled={disabled || isSubmitting}
      />
      <Button 
        type="submit" 
        size="icon"
        variant="secondary"
        className="bg-inventu-blue hover:bg-inventu-blue/80 text-white"
        disabled={disabled || isSubmitting || !comment.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default CommentInput;
