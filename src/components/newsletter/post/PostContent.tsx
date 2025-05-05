
import React from 'react';

interface PostContentProps {
  title: string;
  content: string;
}

export const PostContent: React.FC<PostContentProps> = ({
  title,
  content,
}) => {
  return (
    <>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap">{content}</p>
    </>
  );
};
