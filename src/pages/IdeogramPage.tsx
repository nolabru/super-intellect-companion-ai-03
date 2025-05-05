
import React from 'react';
import IdeogramGenerator from '@/components/ideogram/IdeogramGenerator';

const IdeogramPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Ideogram AI Image Generation</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Gere imagens incríveis com o modelo Ideogram AI. Este gerador utiliza os modelos mais recentes do Ideogram
          para criar imagens a partir de descrições textuais.
        </p>
      </div>
      
      <div className="flex justify-center">
        <IdeogramGenerator />
      </div>
    </div>
  );
};

export default IdeogramPage;
