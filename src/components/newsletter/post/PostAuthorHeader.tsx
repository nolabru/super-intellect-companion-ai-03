
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';

interface PostAuthorHeaderProps {
  authorName?: string;
  authorAvatar?: string | null;
  createdAt: string;
}

export const PostAuthorHeader: React.FC<PostAuthorHeaderProps> = ({
  authorName,
  authorAvatar,
  createdAt,
}) => {
  const formatPostDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      
      // Only show distance if post is less than 7 days old
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
      } else {
        return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data inválida";
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Avatar>
        {authorAvatar ? (
          <AvatarImage src={authorAvatar} alt={authorName || 'Usuário'} />
        ) : (
          <AvatarFallback className="bg-inventu-blue">
            {authorName ? authorName[0].toUpperCase() : 'U'}
          </AvatarFallback>
        )}
      </Avatar>
      <div>
        <p className="text-sm font-medium">{authorName || 'Usuário'}</p>
        <div className="flex items-center text-xs text-white/50">
          <Calendar className="mr-1 h-3 w-3" />
          <span>{formatPostDate(createdAt || new Date().toISOString())}</span>
        </div>
      </div>
    </div>
  );
};
