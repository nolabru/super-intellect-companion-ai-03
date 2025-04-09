
import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ImageGenerationTipProps {
  show: boolean;
}

const ImageGenerationTip: React.FC<ImageGenerationTipProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="mb-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start">
      <Lightbulb className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-gray-300">
          Este modelo pode gerar imagens a partir de sua descrição. Basta descrever a imagem desejada sem adicionar um arquivo.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Exemplo: "Crie uma imagem de um pato usando óculos de sol na praia" ou "Gere uma ilustração de montanhas ao pôr do sol"
        </p>
      </div>
    </div>
  );
};

export default ImageGenerationTip;
