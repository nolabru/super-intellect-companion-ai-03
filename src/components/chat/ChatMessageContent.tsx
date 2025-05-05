
import React, { useEffect, useState } from 'react';
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
  const [parsedContent, setParsedContent] = useState<string>('');
  
  useEffect(() => {
    // For simple loading or error messages, don't use markdown
    if ((isLoading || isError) && content.length < 100) {
      setParsedContent(content);
      return;
    }
    
    // Process content with markdown asynchronously
    const parseMarkdown = async () => {
      try {
        const markdownContent = await marked.parse(content);
        const sanitizedHtml = DOMPurify.sanitize(markdownContent);
        setParsedContent(sanitizedHtml);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setParsedContent(content); // Fallback to plain text
      }
    };
    
    parseMarkdown();
  }, [content, isLoading, isError]);
  
  // For simple loading or error messages, render directly
  if ((isLoading || isError) && content.length < 100) {
    return <div className="mb-1">{content}</div>;
  }
  
  return (
    <div 
      className={`prose prose-invert max-w-none ${isStreaming ? 'streaming-text' : ''}`}
      dangerouslySetInnerHTML={{ __html: parsedContent }}
    />
  );
};

export default ChatMessageContent;
