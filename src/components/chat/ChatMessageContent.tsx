
import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatMessageContentProps {
  content: string;
  isLoading?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
}

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({
  content,
  isLoading,
  isError,
  isStreaming
}) => {
  // For simple loading or error messages, don't use markdown
  if ((isLoading || isError) && content.length < 100) {
    return <div className="mb-1">{content}</div>;
  }
  
  // Process content with markdown
  const sanitizedHtml = DOMPurify.sanitize(marked.parse(content));
  
  return (
    <div 
      className={`prose prose-invert max-w-none ${isStreaming ? 'streaming-text' : ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default ChatMessageContent;
