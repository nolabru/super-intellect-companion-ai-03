
import React from 'react';
import { Newspaper } from 'lucide-react';

export const EmptyFeed: React.FC = () => {
  return (
    <div className="text-center p-8 text-white/60">
      <Newspaper className="mx-auto h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg">Nenhuma publicação ainda</p>
      <p className="text-sm">Volte mais tarde para novidades</p>
    </div>
  );
};
